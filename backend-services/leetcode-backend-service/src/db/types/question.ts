import type mongoose from "mongoose";

/**
 * Shape of a Question document in MongoDB.
 * Used in change streams.
 */
export interface QuestionDoc {
  _id: mongoose.Types.ObjectId;

  // identity
  title: string;
  titleSlug: string;

  // metadata
  difficulty?: "Easy" | "Medium" | "Hard";
  categoryTitle?: string | null;
  timeLimit?: number; // in minutes

  // content
  content?: string | null; // HTML body
  exampleTestcases?: string | null;
  hints?: string[] | null;
  codeSnippets?: Array<{
    lang: string;
    langSlug: string;
    code: string;
  }> | null;
  answer?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}
