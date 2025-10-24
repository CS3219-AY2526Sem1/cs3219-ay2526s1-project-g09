import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Details } from "./types.js";
import type { AnyBulkWriteOperation } from "mongodb";

/**
 * IMPORTANT: set this to the actual relative path of the module that exports:
 *   - seedLeetCodeBatch
 *   - fetchNonPaidQuestionList
 *   - fetchNonPaidQuestionInfo
 *   - getQuestionDetail
 */
const SUT_PATH = "../../../src/leetcode/seedBatch.ts";

// --- Test doubles (module-level state we can tweak per test) ---
const memCursor: Record<string, unknown> = {};
const memQuestions: unknown[] = [];

type ListPayload = { total: number; questions: unknown[] };
type GqlBehavior = {
  listOk: boolean;
  listPayload?: ListPayload;
  detailBySlug: Record<string, unknown>;
};

let gqlBehavior: GqlBehavior;

function resetGqlBehavior() {
  gqlBehavior = {
    listOk: true,
    detailBySlug: {},
  };
}

function makeQuestion(slug: string, isPaidOnly = false) {
  return {
    isPaidOnly,
    titleSlug: slug,
    title: slug.replace(/-/g, " "),
    difficulty: "Easy",
    categoryTitle: "Array",
  };
}

function makeDetail(slug: string) {
  return {
    question: {
      titleSlug: slug,
      title: slug.replace(/-/g, " "),
      difficulty: "Easy",
      categoryTitle: "Array",
      content: "<p>content</p>",
      codeSnippets: [],
      hints: [],
      exampleTestcases: "",
      answer: "",
    },
  };
}

type SeedCursorDoc = {
  _id: string;
  nextSkip?: number;
  pageSize?: number;
  lastRunAt?: Date;
  total?: number;
};

// --- Mocks ---
vi.mock("../../../src/db/model/question", () => {
  return {
    Question: {
      bulkWrite: vi.fn((ops: AnyBulkWriteOperation<Details["question"]>[]) => {
        // Naive “DB”: record the upserts to validate
        memQuestions.push(...ops);
        // Return a mongoose-like BulkWriteResult subset
        return {
          upsertedCount: ops.length, // pretend every op is an upsert
          modifiedCount: 0,
          matchedCount: 0,
        };
      }),
    },
    SeedCursor: class {
      static findById(id: string) {
        return memCursor[id] || null;
      }
      _id: string;
      nextSkip: number;
      pageSize: number;
      lastRunAt: Date | undefined;
      total: number | undefined;

      constructor(doc: SeedCursorDoc) {
        this._id = doc._id;
        this.nextSkip = doc.nextSkip ?? 0;
        this.pageSize = doc.pageSize ?? 200;
        this.total = doc.total;
      }
      save() {
        memCursor[this._id] = this;
      }
    },
  };
});

vi.mock("../../../src/leetcode/client", () => {
  // We dispatch based on the “query” identity that the SUT passes in.
  return {
    gql: vi.fn(async (query: string, vars: { titleSlug: string }) => {
      // The SUT imports QUERY_LIST and QUERY_DETAIL from queries.js.
      // We'll compare the identity of `query` with the mocked exports below.
      const { QUERY_LIST, QUERY_DETAIL } = await vi.importMock(
        "../../../src/leetcode/queries.js",
      );

      if (query === QUERY_LIST) {
        if (!gqlBehavior.listOk) {
          throw new Error("GraphQL list error");
        }
        const payload =
          gqlBehavior.listPayload ??
          ({
            problemsetQuestionList: {
              total: 0,
              questions: [],
            },
          } as unknown as ListPayload);

        // The SUT expects `{ problemsetQuestionList: { total, questions } }`
        return { problemsetQuestionList: payload };
      }

      if (query === QUERY_DETAIL) {
        const slug = vars.titleSlug;
        const detail =
          gqlBehavior.detailBySlug[slug] ?? makeDetail(slug /* default */);
        // The SUT expects `{ question: ... }`
        return detail;
      }

      throw new Error("Unknown query sentinel");
    }),
  };
});

vi.mock("../../../src/leetcode/queries", () => {
  // We just need identity/sentinel values for comparison inside the mocked gql
  const QUERY_LIST = { kind: "LIST" };
  const QUERY_DETAIL = { kind: "DETAIL" };
  return { QUERY_LIST, QUERY_DETAIL };
});

vi.mock("../../../src/logger", () => {
  return {
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
  };
});

vi.mock("../../../src/health", () => {
  return {
    checkQuestionServiceHealth: vi.fn(() => true),
  };
});

// Make p-limit just run the function immediately in tests
vi.mock("p-limit", () => {
  return {
    default: (/* concurrency: number */) => {
      return <T extends (...args: unknown[]) => unknown>(fn: T) => fn();
    },
  };
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  resetGqlBehavior();
  // default env
  process.env.QUESTION_API_URL = "http://any";
  process.env.LEETCODE_DETAIL_CONCURRENCY = "4";
  // reset in-memory “DB”
  for (const k of Object.keys(memCursor)) delete memCursor[k];
  memQuestions.length = 0;
});

afterEach(() => {
  // Reset in-memory DB mocks
  memQuestions.length = 0;
  for (const k of Object.keys(memCursor)) delete memCursor[k];

  // Reset GraphQL behavior
  resetGqlBehavior();

  // Restore environment to clean state
  delete process.env.QUESTION_API_URL;
  delete process.env.LEETCODE_DETAIL_CONCURRENCY;

  // Restore all mocked implementations (without removing mocks)
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Optional: ensure module registry is clean between imports
  vi.resetModules();
});

type responseSummary = {
  ok: boolean;
  message?: string;
  fetched?: number;
  inserted?: number;
  modified?: number;
  matched?: number;
  pageSize?: number;
  nextSkip?: number;
  total?: number;
};

describe("seedLeetCodeBatch", () => {
  it("aborts early if health check fails", async () => {
    const { checkQuestionServiceHealth } = await import("../../../src/health");

    // vi.mocked gives you a typed mocked function
    vi.mocked(checkQuestionServiceHealth).mockRejectedValueOnce(
      new Error("Service down"),
    );

    const { seedLeetCodeBatch } = (await import(SUT_PATH)) as {
      seedLeetCodeBatch: () => Promise<responseSummary>;
    };

    const res = await seedLeetCodeBatch();
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Aborted: question service not healthy/i);
    // Cursor should be created and saved with defaults
    expect(memCursor["questions"]).toBeTruthy();
  });

  it("happy path: seeds a page, filters paid, fetches details, upserts, and advances cursor", async () => {
    gqlBehavior.listPayload = {
      total: 5,
      questions: [
        makeQuestion("two-sum", false),
        makeQuestion("median-of-two-sorted-arrays", true),
        makeQuestion("valid-parentheses", false),
      ],
    };

    gqlBehavior.detailBySlug = {
      "two-sum": makeDetail("two-sum"),
      "valid-parentheses": makeDetail("valid-parentheses"),
    };

    const { SeedCursor } = await import("../../../src/db/model/question");
    const cursor = new SeedCursor({
      _id: "questions",
      nextSkip: 0,
      pageSize: 200,
    });
    await cursor.save();

    const { seedLeetCodeBatch } = (await import(SUT_PATH)) as {
      seedLeetCodeBatch: () => Promise<responseSummary>;
    };
    const res: responseSummary = await seedLeetCodeBatch();

    expect(res.ok).toBe(true);
    expect(res.fetched).toBe(2);
    expect(res.inserted).toBe(2);
    expect(res.modified).toBe(0);
    expect(res.matched).toBe(0);
    expect(res.pageSize).toBe(200);

    expect(res.nextSkip).toBe(5);
    expect(res.total).toBe(5);

    const { Question } = await import("../../../src/db/model/question");

    const bulkWriteSpy = vi.spyOn(Question, "bulkWrite");

    expect(bulkWriteSpy).toHaveBeenCalledTimes(1);
    type Ops = Parameters<typeof Question.bulkWrite>[0];
    const [firstCallArgs] = bulkWriteSpy.mock.calls[0] ?? [];
    const ops = firstCallArgs as Ops;

    type UpdateOneOp = Extract<Ops[number], { updateOne: unknown }>;
    const updateOnes = ops.filter((op): op is UpdateOneOp => "updateOne" in op);

    const slugs = updateOnes
      .map(
        (op) =>
          (op.updateOne as unknown as { filter: { titleSlug: string } }).filter
            .titleSlug,
      )
      .sort();

    expect(slugs).toEqual(["two-sum", "valid-parentheses"]);
  });

  it("returns 'No more questions.' when the page is empty", async () => {
    gqlBehavior.listPayload = {
      total: 42,
      questions: [],
    };

    const { seedLeetCodeBatch } = (await import(SUT_PATH)) as {
      seedLeetCodeBatch: () => Promise<responseSummary>;
    };
    const res = await seedLeetCodeBatch();

    expect(res.ok).toBe(true);
    expect(res.message).toMatch(/No more questions/i);
    expect(res.nextSkip).toBe(42); // set to total to stop future refetch
  });

  it("returns an error result when fetching the list fails", async () => {
    await import("../../../src/leetcode/client");
    resetGqlBehavior();
    gqlBehavior.listOk = false;

    const { seedLeetCodeBatch } = (await import(SUT_PATH)) as {
      seedLeetCodeBatch: () => Promise<responseSummary>;
    };
    const res = await seedLeetCodeBatch();

    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Failed to fetch question list/i);

    const { logger } = await import("../../../src/logger.js");
    expect(logger.error).toHaveBeenCalled();
  });
});
