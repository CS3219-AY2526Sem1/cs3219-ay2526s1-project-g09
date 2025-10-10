import type mongoose from "mongoose";

/**
 * Shape of a Question document in MongoDB.
 * Used in change streams.
 */
export interface QuestionDoc {
  _id: mongoose.Types.ObjectId;

  // identity
  globalSlug: string; // e.g. "leetcode:two-sum"
  title: string;
  titleSlug: string;
  source: "leetcode";

  // metadata
  difficulty?: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
  timeLimit?: number; // in seconds

  // content
  content?: string | null; // HTML body
  exampleTestcases?: string | null;
  hints?: string[] | null;
  codeSnippets?: Array<{
    lang: string;
    langSlug: string;
    code: string;
  }> | null;

  createdAt?: Date;
  updatedAt?: Date;
}
