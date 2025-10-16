export interface Question {
  id: string;
  title: string;
  body: string;
  topics: string[];
  hints: string[];
  answer: string;
  difficulty: string;
  timeLimit: number;
}
