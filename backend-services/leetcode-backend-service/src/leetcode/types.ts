export type Difficulty = "Easy" | "Medium" | "Hard";

export type TopicTag = { name: string; titleSlug?: string; id: string };

export type BasicInformation = {
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: Difficulty;
  categoryTitle?: string | null;
  topicTags: TopicTag[];
};

export type QuestionListResp = {
  problemsetQuestionList: {
    total: number;
    hasMore?: boolean;
    questions: BasicInformation[];
  };
};

export type DetailQuestion =
  | (BasicInformation & {
      content: string | null;
      exampleTestcases?: string | null;
      hints?: string[] | null;
      codeSnippets?: { lang: string; langSlug: string; code: string }[] | null;
    })
  | null;

export type DetailsResp = { question: DetailQuestion };
