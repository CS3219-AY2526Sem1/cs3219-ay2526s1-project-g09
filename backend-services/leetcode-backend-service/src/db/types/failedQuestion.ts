export interface FailedQuestion {
  provider: string; // e.g., "leetcode"
  leetcodeIndex: number;
  attempts: number; // number of attempts made to fetch the question
  lastTriedAt?: Date; // timestamp of the last attempt
  createdAt?: Date;
  updatedAt?: Date;
}
