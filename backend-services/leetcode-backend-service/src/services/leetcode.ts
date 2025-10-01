import { gql } from "../queries/leetcode.js";
import { QUERY_LIST, QUERY_DETAIL } from "../queries/leetcode.js";
import pLimit from "p-limit";
import { Question } from "../models/question.js";

export type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
  topicTags: { name: string; titleSlug: string; id: string }[];
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

const PAGE_SIZE = 50;
const DETAIL_CONCURRENCY = 6;

export async function upsertMany(questions: Details["question"][]) {
  const aggregate = questions.filter(Boolean).map((question) => ({
    updateOne: {
      filter: { titleSlug: question!.titleSlug },
      update: {
        $set: {
          ...question!,
          lastSyncedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (aggregate.length) {
    await Question.bulkWrite(aggregate, { ordered: false });
  }
}

export async function syncAllNonPaid() {
  const questionList = await fetchAllNonPaidSlugs();
  const limit = pLimit(DETAIL_CONCURRENCY);

  const details = await Promise.all(
    questionList.map((question: BasicInformation) =>
      limit(async () => {
        const detail = await getQuestionDetail(question.titleSlug);
        if (detail && !detail.isPaidOnly) {
          return detail;
        }
        return null;
      }),
    ),
  );

  await upsertMany(details as NonNullable<Details["question"]>[]);
  return {
    scanned: questionList.length,
    upserted: details.filter(Boolean).length,
  };
}

export async function fetchAllNonPaidSlugs(): Promise<BasicInformation[]> {
  let skip = 0;
  let total = Infinity;
  const out: BasicInformation[] = [];

  while (skip < total) {
    const res = await gql<
      QuestionList,
      {
        categorySlug: string;
        limit: number;
        skip: number;
        filters: Record<string, unknown>;
      }
    >(QUERY_LIST, {
      categorySlug: "",
      limit: PAGE_SIZE,
      skip: skip,
      filters: {},
    });

    const questionList = res.problemsetQuestionList;
    total = questionList.total ?? 0;
    const questions: BasicInformation[] = questionList.questions;

    for (const question of questions) {
      if (!question.isPaidOnly) {
        out.push(question);
      }
    }

    skip = skip + PAGE_SIZE;
    await new Promise((r) => setTimeout(r, 130));
  }

  return out;
}

export async function getQuestionDetail(slug: string) {
  const res = await gql<Details, { titleSlug: string }>(QUERY_DETAIL, {
    titleSlug: slug,
  });
  return res.question;
}
