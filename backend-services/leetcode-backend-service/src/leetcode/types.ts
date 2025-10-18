/**
 * Types for LeetCode GraphQL API responses.
 */

export type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
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
