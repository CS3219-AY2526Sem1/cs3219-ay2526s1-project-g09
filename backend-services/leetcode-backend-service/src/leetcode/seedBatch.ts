/**
 * Fetch and store a batch of LeetCode questions.
 * This script fetches a batch of questions from LeetCode's GraphQL API,
 * filters out paid questions, and stores the non-paid questions in the database.
 * It uses a cursor to keep track of progress and can be run multiple times
 * to continue fetching more questions until all are processed.
 */
import { Question, SeedCursor } from "../db/model/question.js";
import { gql } from "./client.js";
import { QUERY_LIST, QUERY_DETAIL } from "./queries.js";
import type { BasicInformation, QuestionList, Details } from "./types.js";
import pLimit from "p-limit";
import { logger } from "../logger.js";
import { checkQuestionServiceHealth } from "../health.js";

/**
 * Maximum number of concurrent requests for fetching question details.
 * This can be configured via the LEETCODE_DETAIL_CONCURRENCY environment variable.
 * The default value (6) is chosen to balance performance and avoid hitting LeetCode's API rate limits (if any).
 */
const DETAIL_CONCURRENCY = (() => {
  const env = process.env.LEETCODE_DETAIL_CONCURRENCY;
  const parsed = Number(env);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 6;
})();

// Time limits (in minutes) for each difficulty level.
const DIFFICULTY_TIME_LIMITS: Record<string, number> = {
  Easy: 30,
  Medium: 60,
  Hard: 120,
};

/**
 * Run one batch (default pageSize=200). Returns a summary.
 * @returns An object containing the result of the seeding operation.
 */
export async function seedLeetCodeBatch() {
  const id = "questions";
  const cursor =
    (await SeedCursor.findById(id)) ??
    new SeedCursor({ _id: id, nextSkip: 0, pageSize: 200 });
  const { pageSize, nextSkip } = cursor;

  try {
    await checkQuestionServiceHealth();
  } catch (err) {
    cursor.lastRunAt = new Date();
    await cursor.save();
    return {
      ok: false as const,
      message: `Aborted: question service not healthy — ${(err as Error).message}`,
      nextSkip: cursor.nextSkip,
    };
  }

  // Fetch question list using the cursor's nextSkip
  const { questionList, total } = await fetchNonPaidQuestionList(
    pageSize,
    nextSkip,
  );

  // Check if total is valid, could be undefined if fail to connect to LeetCode
  if (total === undefined || total === null) {
    cursor.lastRunAt = new Date();
    await cursor.save();
    return {
      ok: false as const,
      message:
        "Failed to fetch total number of questions from leetcode. Possible failed connection to LeetCode.",
      nextSkip: cursor.nextSkip,
    };
  }

  // Check if there are no more questions to fetch
  if (questionList.length === 0 || nextSkip >= total) {
    cursor.lastRunAt = new Date();
    cursor.total = total ?? cursor.total;
    cursor.nextSkip = total; // Prevent future refetching of previously fetched items
    await cursor.save();
    return {
      ok: true,
      message: "No more questions.",
      nextSkip: cursor.nextSkip,
    };
  }

  const questionInfos: QuestionDetail[] = await fetchNonPaidQuestionInfo(
    pageSize,
    nextSkip,
    questionList,
  );

  const ops = questionInfos.map((q) => ({
    updateOne: {
      filter: { titleSlug: q.titleSlug },
      update: {
        // $setOnInsert to avoid overwriting existing entries
        $setOnInsert: {
          globalSlug: `leetcode:${q.titleSlug}`,
          source: "leetcode",
          titleSlug: q.titleSlug,
          title: q.title,

          // metadata
          difficulty: q.difficulty,
          categoryTitle: q.categoryTitle ?? null,
          timeLimit: DIFFICULTY_TIME_LIMITS[q.difficulty] ?? 60,

          // content & extras
          content: q.content ?? null,
          codeSnippets: q.codeSnippets ?? [],
          hints: q.hints ?? [],
          exampleTestcases: q.exampleTestcases ?? null,
          createdAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  const result = await Question.bulkWrite(ops, { ordered: false });

  // Advance cursor
  if (nextSkip + pageSize > total) {
    // Prevent future refetching of previously fetched items
    cursor.nextSkip = total;
  } else {
    cursor.nextSkip = nextSkip + pageSize;
  }
  cursor.lastRunAt = new Date();
  cursor.total = total;
  await cursor.save();

  return {
    ok: true,
    inserted: result.upsertedCount ?? 0,
    modified: result.modifiedCount ?? 0,
    matched: result.matchedCount ?? 0,
    fetched: questionList.length,
    pageSize,
    nextSkip: cursor.nextSkip,
    total: cursor.total,
  };
}

type QuestionDetail = NonNullable<Details["question"]>;

/**
 * Fetch non-paid question information.
 * We will only store non-paid questions in our database because
 * content of paid questions will not be accessible without a premium account.
 * @param limit - The maximum number of questions to fetch.
 * @param skip - The number of questions to skip.
 * @param questionList - The list of basic question information to fetch details for.
 * @returns An array of non-paid question details.
 */
export async function fetchNonPaidQuestionInfo(
  limit: number,
  skip: number,
  questionList: BasicInformation[],
): Promise<QuestionDetail[]> {
  const limitConcurrency = pLimit(DETAIL_CONCURRENCY);

  const tasks = questionList.map((q) =>
    limitConcurrency(async () => {
      try {
        const detail = await getQuestionDetail(q.titleSlug);
        return detail ?? null;
      } catch {
        logger.error(`Failed to fetch details for ${q.titleSlug}`);
        return null;
      }
    }),
  );

  const results = await Promise.all(tasks);
  return results.filter((d): d is QuestionDetail => d !== null);
}

/**
 * Fetch non-paid question list.
 * We will only store non-paid questions in our database because
 * content of paid questions will not be accessible without a premium account.
 */
export async function fetchNonPaidQuestionList(
  limit: number,
  skip: number,
): Promise<{
  questionList: BasicInformation[];
  total: number;
}> {
  const res = await gql<
    QuestionList,
    {
      categorySlug: string;
      limit: number;
      skip: number;
      filters: Record<string, unknown>;
    }
  >(QUERY_LIST, { categorySlug: "", limit: limit, skip: skip, filters: {} });

  const { total, questions } = res.problemsetQuestionList;
  const questionList = questions.filter((q) => !q.isPaidOnly);
  return { questionList, total };
}

export async function getQuestionDetail(slug: string) {
  const res = await gql<Details, { titleSlug: string }>(QUERY_DETAIL, {
    titleSlug: slug,
  });
  return res.question;
}
