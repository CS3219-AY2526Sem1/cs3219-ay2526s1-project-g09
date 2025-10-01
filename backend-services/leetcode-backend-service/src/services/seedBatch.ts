// scripts/seedBatch.ts
import { Question, SeedCursor } from "../models/question.js";
import { gql } from "../queries/leetcode.js";
import { QUERY_LIST, QUERY_DETAIL } from "../queries/leetcode.js";

export type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
  topicTags: { name: string; slug: string; id: string }[];
};

export type QuestionList = {
  problemsetQuestionList: {
    total: number;
    questions: BasicInformation[];
  };
};

export type Details = {
  question:
    | (BasicInformation & {
        content: string | null;
        exampleTestcases?: string | null;
        hints?: string[] | null;
        codeSnippets?:
          | { lang: string; langSlug: string; code: string }[]
          | null;
      })
    | null;
};

/**
 * Run one batch (default pageSize=200). Returns a summary.
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

  // fetch the question details from skip with size pageSize
  // these are the information that needs to be inserted
  const questionInfos: QuestionDetail[] = await fetchNonPaidQuestionInfo(
    pageSize,
    nextSkip,
  );

  // Build bulk ops (idempotent upserts keyed by titleSlug)
  const ops = questionInfos.map((q) => ({
    updateOne: {
      // Use the same field you persist & index
      filter: { slug: q.titleSlug },

      // All update operators must be inside `update`
      update: {
        $set: {
          // keep slug in the doc
          slug: q.titleSlug,

          // ids/titles
          title: q.title,

          // metadata
          difficulty: q.difficulty,
          isPaidOnly: q.isPaidOnly,
          categoryTitle: q.categoryTitle ?? null,
          topicTags: q.topicTags ?? [],

          // content & extras
          content: q.content ?? null,
          codeSnippets: q.codeSnippets ?? [],
          hints: q.hints ?? [],
          exampleTestcases: q.exampleTestcases ?? null,
          updatedAt: new Date(),
        },

        // only on first insert
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

export async function fetchNonPaidQuestionInfo(
  limit: number,
  skip: number,
): Promise<QuestionDetail[]> {
  const out: QuestionDetail[] = [];

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

  for (const question of questions) {
    if (!question.isPaidOnly) {
      const questionDetail = await getQuestionDetail(question.titleSlug);
      if (questionDetail) {
        out.push(questionDetail);
      }
    }
  }

  return out;
}

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
