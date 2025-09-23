import { gql } from "../queries/leetcode.js";
import { QUERY_LIST, QUERY_DETAIL } from "../queries/leetcode.js";

export type BasicQuestion = {
  title: string;
  titleSlug: string;
  difficulty: string;
};

export type GqlQuestionDetail = {
  question: {
    title: string;
    titleSlug: string;
    isPaidOnly: boolean;
    difficulty: "Easy" | "Medium" | "Hard";
    content: string | null;
    exampleTestcases?: string | null;
    categoryTitle?: string | null;
    codeSnippets: { lang: string; langSlug: string; code: string }[];
    hints?: string[] | null;
  } | null;
};

export async function listFirstN(n = 5) {
  const res = await gql<
    {
      problemsetQuestionList: {
        total: number;
        questions: BasicQuestion[];
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
  const res = await gql<GqlQuestionDetail, { titleSlug: string }>(
    QUERY_DETAIL,
    { titleSlug: slug },
  );
  return res.question;
}
