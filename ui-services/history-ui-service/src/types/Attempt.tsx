import type { Question } from "./Question";

export interface Attempt {
  id?: string;
  question: Question;
  date: Date;
  partner?: string;
  timeTaken?: string | number;
}
