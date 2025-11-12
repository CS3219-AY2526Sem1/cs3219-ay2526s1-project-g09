import { z } from "zod";

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;
export const TIME_LIMIT = { MIN: 1, MAX: 240 } as const;
export const TITLE_MAX_LENGTH = 100;
export const CATEGORY_MAX_LENGTH = 100;

export const questionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      TITLE_MAX_LENGTH,
      `Title must be ${TITLE_MAX_LENGTH} characters or less`,
    ),
  categoryTitle: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(
      CATEGORY_MAX_LENGTH,
      `Category must be ${CATEGORY_MAX_LENGTH} characters or less`,
    ),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  timeLimit: z.coerce
    .number()
    .int("Time limit must be a whole number")
    .min(TIME_LIMIT.MIN, `Time limit must be at least ${TIME_LIMIT.MIN} minute`)
    .max(TIME_LIMIT.MAX, `Time limit cannot exceed ${TIME_LIMIT.MAX} minutes`),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(100000, "Content is too long"),
  hints: z.array(z.string()),
  answer: z.string().max(10000, "Answer is too long").optional(),
});

export type QuestionForm = z.infer<typeof questionFormSchema>;
export type Difficulty = QuestionForm["difficulty"];
