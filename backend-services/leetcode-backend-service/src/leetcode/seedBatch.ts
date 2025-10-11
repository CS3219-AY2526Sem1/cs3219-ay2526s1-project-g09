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

const DETAIL_CONCURRENCY = 6;

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
    new SeedCursor({ _id: id, nextSkip: 0, pageSize: 200, done: false });

  if (cursor.done) {
    return {
      ok: true,
      message: "Already completed.",
      nextSkip: cursor.nextSkip,
      done: true,
    };
  }

  const { pageSize, nextSkip } = cursor;

  const { questionList, total, initial_count } = await fetchNonPaidQuestionList(
    pageSize,
    nextSkip,
  );

  if (questionList.length === 0) {
    cursor.done = true;
    cursor.lastRunAt = new Date();
    cursor.total = total ?? cursor.total;
    await cursor.save();
    return {
      ok: true,
      message: "No more questions. Marked done.",
      nextSkip,
      done: true,
    };
  }

  const questionInfos: QuestionDetail[] = await fetchNonPaidQuestionInfo(
    pageSize,
    nextSkip,
  );

  const ops = questionInfos.map((q) => ({
    updateOne: {
      filter: { titleSlug: q.titleSlug },

      update: {
        $set: {
          globalSlug: `leetcode:${q.titleSlug}`, // unique identifier
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
          updatedAt: new Date(),
        },

        $setOnInsert: {
          createdAt: new Date(),
        },
      },

      upsert: true,
    },
  }));

  const result = await Question.bulkWrite(ops, { ordered: false });

  // Advance cursor
  cursor.nextSkip = nextSkip + pageSize;
  cursor.lastRunAt = new Date();
  cursor.total = total;
  if (initial_count < pageSize) {
    cursor.done = true;
  }
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
    done: cursor.done,
  };
}

type QuestionDetail = NonNullable<Details["question"]>;

/**
 * Fetch non-paid question information.
 * We will only store non-paid questions in our database because
 * content of paid questions will not be accessible without a premium account.
 * @param limit - The maximum number of questions to fetch.
 * @param skip - The number of questions to skip.
 * @returns An array of non-paid question details.
 */
export async function fetchNonPaidQuestionInfo(
  limit: number,
  skip: number,
): Promise<QuestionDetail[]> {
  const res = await gql<
    QuestionList,
    {
      categorySlug: string;
      limit: number;
      skip: number;
      filters: Record<string, unknown>;
    }
  >(QUERY_LIST, { categorySlug: "", limit: limit, skip: skip, filters: {} });

  const questionList = res.problemsetQuestionList;
  const questions: BasicInformation[] = questionList.questions;

  const limitConcurrency = pLimit(DETAIL_CONCURRENCY);

  const tasks = questions
    .filter((q) => !q.isPaidOnly)
    .map((q) =>
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
  initial_count: number;
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
  const initial_count = questions.length;
  const questionList = questions.filter((q) => !q.isPaidOnly);
  return { questionList, total, initial_count };
}

export async function getQuestionDetail(slug: string) {
  const res = await gql<Details, { titleSlug: string }>(QUERY_DETAIL, {
    titleSlug: slug,
  });
  return res.question;
}
