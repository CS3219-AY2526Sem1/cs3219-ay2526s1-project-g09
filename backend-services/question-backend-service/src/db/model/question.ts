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
    source: { type: String, required: true, index: true }, // source of the question, e.g. "leetcode"
    globalSlug: { type: String, required: true, unique: true, index: true }, // unique identifier, e.g. "leetcode:two-sum"
    titleSlug: { type: String, required: true, index: true }, // slug of the title, e.g. "two-sum"
    title: { type: String, required: true, index: true }, // full title, e.g. "Two Sum"

    // meta
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    categoryTitle: { type: String, required: false, index: true },
    timeLimit: { type: Number, required: true }, // in minutes

    // content
    content: { type: String, required: true }, // HTML body
    exampleTestcases: { type: String, required: false },
    codeSnippets: { type: [CodeSnippetSchema], default: [] },
    hints: { type: [String], default: [] },
    sampleTestCase: { type: String, required: false },
  },
  { collection: "questions", timestamps: true },
);

QuestionSchema.index({
  source: 1,
  titleSlug: 1,
  categoryTitle: 1,
  difficulty: 1,
});

export type QuestionDoc = InferSchemaType<typeof QuestionSchema>;

// Reuse existing model in dev/hot-reload to avoid OverwriteModelError
export const Question: Model<QuestionDoc> =
  (mongoose.models.Question as Model<QuestionDoc> | undefined) ||
  model<QuestionDoc>("Question", QuestionSchema);
