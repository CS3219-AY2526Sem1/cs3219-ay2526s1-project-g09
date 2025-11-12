/**
 * Types for LeetCode GraphQL API responses.
 */

export type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
};

export type Details = {
  question:
    | (BasicInformation & {
        difficulty: "Easy" | "Medium" | "Hard";
        categoryTitle?: string | null;
        content: string | null;
        exampleTestcases?: string | null;
        hints?: string[] | null;
        codeSnippets?:
          | { lang: string; langSlug: string; code: string }[]
          | null;
      })
    | null;
};
