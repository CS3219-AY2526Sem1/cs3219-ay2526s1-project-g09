import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * IMPORTANT: set this to the actual relative path of the module that exports:
 *   - seedLeetCodeBatch
 *   - fetchNonPaidQuestionList
 *   - fetchNonPaidQuestionInfo
 *   - getQuestionDetail
 */
const SUT_PATH = "../../../src/leetcode/seedBatch.js";

// --- Test doubles (module-level state we can tweak per test) ---
const memCursor: Record<string, any> = {};
const memQuestions: any[] = [];

type ListPayload = { total: number; questions: any[] };
type GqlBehavior = {
  listOk: boolean;
  listPayload?: ListPayload;
  detailBySlug: Record<string, any>;
};

let gqlBehavior: GqlBehavior;

function resetGqlBehavior() {
  gqlBehavior = {
    listOk: true,
    detailBySlug: {},
  };
}

function makeQuestion(
  slug: string,
  isPaidOnly = false,
  extra: Partial<any> = {},
) {
  return {
    isPaidOnly,
    titleSlug: slug,
    title: slug.replace(/-/g, " "),
    difficulty: "Easy",
    categoryTitle: "Array",
    ...extra,
  };
}

function makeDetail(slug: string, extra: Partial<any> = {}) {
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

// --- Mocks ---
vi.mock("../../../src/db/model/question", () => {
  return {
    Question: {
      bulkWrite: vi.fn(async (ops: any[]) => {
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
      static async findById(id: string) {
        return memCursor[id] || null;
      }
      _id: string;
      nextSkip: number;
      pageSize: number;
      lastRunAt: Date | undefined;
      total: number | undefined;

      constructor(doc: any) {
        this._id = doc._id;
        this.nextSkip = doc.nextSkip ?? 0;
        this.pageSize = doc.pageSize ?? 200;
        this.total = doc.total;
      }
      async save() {
        memCursor[this._id] = this;
      }
    },
  };
});

vi.mock("../../../src/leetcode/client", () => {
  // We dispatch based on the “query” identity that the SUT passes in.
  return {
    gql: vi.fn(async (query: any, vars: any) => {
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
          } as any);

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
    checkQuestionServiceHealth: vi.fn(async () => true),
  };
});

// Make p-limit just run the function immediately in tests
vi.mock("p-limit", () => {
  return {
    default: (/* concurrency: number */) => {
      return (fn: any) => fn();
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

describe("seedLeetCodeBatch", () => {
  it("aborts early if health check fails", async () => {
    const { checkQuestionServiceHealth } = await import("../../../src/health");
    (checkQuestionServiceHealth as any).mockRejectedValueOnce(
      new Error("Service down"),
    );

    const { seedLeetCodeBatch } = await import(SUT_PATH);

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
    const cursor = new (SeedCursor as any)({
      _id: "questions",
      nextSkip: 0,
      pageSize: 200,
    });
    await cursor.save();

    const { seedLeetCodeBatch } = await import(SUT_PATH);
    const res = await seedLeetCodeBatch();

    expect(res.ok).toBe(true);
    expect(res.fetched).toBe(2);
    expect(res.inserted).toBe(2);
    expect(res.modified).toBe(0);
    expect(res.matched).toBe(0);
    expect(res.pageSize).toBe(200);

    expect(res.nextSkip).toBe(5);
    expect(res.total).toBe(5);

    const { Question } = await import("../../../src/db/model/question");
    expect(Question.bulkWrite).toHaveBeenCalledTimes(1);
    const [ops] = (Question.bulkWrite as any).mock.calls[0];
    const slugs = ops.map((o: any) => o.updateOne.filter.titleSlug).sort();
    expect(slugs).toEqual(["two-sum", "valid-parentheses"]);
  });

  it("returns 'No more questions.' when the page is empty", async () => {
    gqlBehavior.listPayload = {
      total: 42,
      questions: [],
    };

    const { seedLeetCodeBatch } = await import(SUT_PATH);
    const res = await seedLeetCodeBatch();

    expect(res.ok).toBe(true);
    expect(res.message).toMatch(/No more questions/i);
    expect(res.nextSkip).toBe(42); // set to total to stop future refetch
  });

  it("returns an error result when fetching the list fails", async () => {
    const { gql } = await import("../../../src/leetcode/client");
    resetGqlBehavior();
    gqlBehavior.listOk = false;

    const { seedLeetCodeBatch } = await import(SUT_PATH);
    const res = await seedLeetCodeBatch();

    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Failed to fetch question list/i);

    const { logger } = await import("../../../src/logger.js");
    expect(logger.error).toHaveBeenCalled();
  });
});
