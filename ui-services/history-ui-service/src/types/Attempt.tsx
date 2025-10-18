import type { Question } from "./Question";

export interface Attempt {
  question: Question;
  date: Date;
  partner: string;
  timeTaken: string;
}
