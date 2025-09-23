import { gql } from "../queries/leetcode.js";
import { QUERY_LIST, QUERY_DETAIL } from "../queries/leetcode.js";
import pLimit from "p-limit";

type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
  topicTags: { name: string; slug: string; id: string }[];
};

type QuestionList = {
  problemsetQuestionList: {
    total: number;
    questions: BasicInformation[];
  };
};

type Details = {
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
    >(QUERY_LIST, { categorySlug: "", limit: total, skip: skip, filters: {} });

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

export async function listFirstN(n = 5) {
  const res = await gql<
    {
      problemsetQuestionList: {
        total: number;
        questions: BasicInformation[];
      };
    },
    {
      categorySlug: string;
      limit: number;
      skip: number;
      filters: Record<string, unknown>;
    }
  >(QUERY_LIST, { categorySlug: "", limit: n, skip: 0, filters: {} });

  return res.problemsetQuestionList;
}

export async function getQuestionDetail(slug: string) {
  const res = await gql<Details, { titleSlug: string }>(QUERY_DETAIL, {
    titleSlug: slug,
  });
  return res.question;
}
