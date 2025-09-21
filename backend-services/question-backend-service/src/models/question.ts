// Model for MongoDB
import { Schema, model, models } from "mongoose";

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    tags: { type: [String], default: [] },
    // Other attributes that can be changed (e.g., leetcodeSlug, paidOnly, etc.)
  },
  { timestamps: true }
);

// Reuse model in dev
export const Question = models.Question || model("Question", QuestionSchema);
