export interface HistoryEntry {
  id: string;
  sessionId: string;
  userId: string;
  participants: string[];
  questionId: string;
  questionTitle: string;
  difficulty?: string;
  topics: string[];
  timeLimit?: number;
  language?: string;
  code: string;
  sessionEndedAt?: Date;
  sessionStartedAt?: Date;
  durationMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
