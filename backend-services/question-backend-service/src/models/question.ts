// Model for MongoDB
import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

const QuestionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    // difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    content: { type: String, required: true }
  },
  { collection: "leetcode-questions",
    timestamps: true
   }
);

export type QuestionDoc = InferSchemaType<typeof QuestionSchema>;

// Reuse existing model in dev/hot-reload to avoid OverwriteModelError
export const Question: Model<QuestionDoc> =
  (mongoose.models.Question as Model<QuestionDoc> | undefined) ||
  model<QuestionDoc>("Question", QuestionSchema);
