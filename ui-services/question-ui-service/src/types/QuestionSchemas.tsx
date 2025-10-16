import { z } from "zod";

export const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  categoryTitle: z.string().max(100, "Category title too long"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  timeLimit: z.number().min(1).max(240),
  content: z.string().min(1, "Content cannot be empty"),
});

export type QuestionForm = z.infer<typeof questionSchema>;

export interface QuestionFormValues extends QuestionForm {
  hints: string[];
}
