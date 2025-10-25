export interface StartSessionPayload {
  questionId: string;
  users: string[];
  sessionId?: string;
}

export interface CollabSession {
  sessionId: string;
  questionId: string;
  users?: string[];
  active: boolean;
  createdAt?: string;
  endedAt?: string;
  timeTaken?: number;
  question?: {
    questionId: string;
    title: string;
    body: string;
    topics: string[];
    hints: string[];
    answer: string;
    timeLimit?: number;
    raw?: unknown;
  } | null;
}

export interface StartSessionResponse {
  success?: boolean;
  session?: CollabSession;
  error?: string;
}

export interface ActiveSessionResponse {
  success?: boolean;
  session?: CollabSession;
  error?: string;
}

export interface ConnectSessionResponse {
  success?: boolean;
  session?: CollabSession;
  addedUser?: boolean;
  error?: string;
}
