import type { CollabSession } from "@/api/routes/collabService";

export interface UserPreferences {
  userId: string;
  topics: Record<string, string[]>;
}

export type MatchDetails = UserPreferences;

export interface MatchingResponse {
  status: "MATCHED" | "PENDING" | "REJECTED";
  match: MatchDetails;
  matchId: string;
}

export type MatchResult =
  | { status: "found"; data: MatchingResponse }
  | { status: "notFound" }
  | { status: "cancelled" }
  | { status: "error"; error: unknown };

export type PreferenceResult =
  | { status: "found"; data: UserPreferences }
  | { status: "notFound" }
  | { status: "error"; error: unknown };

export interface MatchAcceptanceResponse {
  status: "SUCCESS" | "REJECTED" | "PENDING";
  session?: CollabSession | null;
}

export interface TimeoutConfig {
  matchRequestTimeout: number;
  matchAcceptanceTimeout: number;
}
