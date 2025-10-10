import mongoose, {
  Schema,
  model,
  type Model,
  type InferSchemaType,
} from "mongoose";

import type { QuestionDoc } from "../types/question.js";

const CodeSnippetSchema = new Schema(
  {
    lang: { type: String, required: true },
    langSlug: { type: String, required: true },
    code: { type: String, required: true },
  },
  { _id: false },
);

const QuestionSchema = new Schema<QuestionDoc>(
  {
    source: { type: String, required: true, index: true },
    globalSlug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    titleSlug: { type: String, required: true, index: true },

    // meta
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    isPaidOnly: { type: Boolean, required: true, index: true },
    categoryTitle: { type: String, required: false, index: true },

    // content
    content: { type: String, required: true }, // HTML body
    exampleTestcases: { type: String, required: false },
    codeSnippets: { type: [CodeSnippetSchema], default: [] },
    hints: { type: [String], default: [] },
  },
  { collection: "questions", timestamps: true },
);

QuestionSchema.index({
  source: 1,
  titleSlug: 1,
  categoryTitle: 1,
  difficulty: 1,
});

const CursorSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    nextSkip: { type: Number, default: 0, index: true },
    pageSize: { type: Number, default: 200 },
    done: { type: Boolean, default: false },
    lastRunAt: { type: Date },
    total: { type: Number, default: 0 },
  },
  { collection: "seed-cursor", timestamps: true },
);

// Reuse existing model in dev/hot-reload to avoid OverwriteModelError
export const Question: Model<QuestionDoc> =
  (mongoose.models.Question as Model<QuestionDoc> | undefined) ||
  model<QuestionDoc>("Question", QuestionSchema);

export type SeedCursor = InferSchemaType<typeof CursorSchema>; // _id is string now
export const SeedCursor = mongoose.model<SeedCursor>(
  "SeedCursor",
  CursorSchema,
);
