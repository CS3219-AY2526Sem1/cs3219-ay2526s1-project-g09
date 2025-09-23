import mongoose, {
  Schema,
  model,
  type Model,
  type InferSchemaType,
} from "mongoose";

const CodeSnippetSchema = new Schema(
  {
    lang: { type: String, required: true },
    langSlug: { type: String, required: true },
    code: { type: String, required: true },
  },
  { _id: false },
);

const QuestionSchema = new Schema(
  {
    // identity
    slug: { type: String, required: true, unique: true, index: true }, // titleSlug
    title: { type: String, required: true, index: true },

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
    codeSnippets: { type: [CodeSnippetSchema], default: [] },
    hints: { type: [String], default: [] },
    sampleTestCase: { type: String, required: false },
  },
  { collection: "leetcode-questions", timestamps: true },
);

QuestionSchema.index({ slug: 1 }, { unique: true });
QuestionSchema.index({ category: 1, difficulty: 1, title: 1 });

export type QuestionDoc = InferSchemaType<typeof QuestionSchema>;

// Reuse existing model in dev/hot-reload to avoid OverwriteModelError
export const Question: Model<QuestionDoc> =
  (mongoose.models.Question as Model<QuestionDoc> | undefined) ||
  model<QuestionDoc>("Question", QuestionSchema);
