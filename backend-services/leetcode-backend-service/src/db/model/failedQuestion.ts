import { Schema, model } from "mongoose";

const failedQuestionSchema = new Schema(
  {
    provider: { type: String, required: true, default: "leetcode" },
    leetcodeIndex: { type: Number, required: true },
    attempts: { type: Number, default: 0 },
    lastTriedAt: { type: Date },
  },
  { timestamps: true },
);

failedQuestionSchema.index({ leetcodeIndex: 1 }, { unique: true });

export const FailedQuestion = model("FailedQuestion", failedQuestionSchema);
