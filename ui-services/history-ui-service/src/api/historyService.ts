import type { HistoryEntry } from "@/types/HistoryEntry";

const isDev = import.meta.env.VITE_MODE === "dev";

const HISTORY_BASE_URL = isDev
  ? "http://localhost:5278"
  : "https://d2zqikej7k9p0j.cloudfront.net";

const HISTORY_SERVICE_BASE_URL = HISTORY_BASE_URL + "/api/v1/history-service";

interface HistoryApiResponse {
  success?: boolean;
  items?: HistoryEntryPayload[];
  total?: number;
  limit?: number;
  skip?: number;
  error?: string;
}

interface HistoryEntryPayload {
  _id?: string;
  id?: string;
  sessionId?: string;
  userId?: string;
  participants?: unknown;
  question?: {
    questionId?: string;
    title?: string;
    difficulty?: string;
    topics?: unknown;
    timeLimit?: number;
  };
  code?: string;
  language?: string;
  sessionEndedAt?: string;
  sessionStartedAt?: string;
  durationMs?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const normaliseString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<string>();
  for (const entry of value) {
    const normalised = normaliseString(entry);
    if (normalised) {
      unique.add(normalised);
    }
  }
  return Array.from(unique);
};

const mapToHistoryEntry = (payload: HistoryEntryPayload): HistoryEntry => {
  const questionId = normaliseString(payload.question?.questionId) ?? "";

  const sessionId = normaliseString(payload.sessionId) ?? "";
  const userId = normaliseString(payload.userId) ?? "";

  return {
    id:
      normaliseString(payload._id) ??
      normaliseString(payload.id) ??
      `${sessionId}:${userId}`,
    sessionId,
    userId,
    participants: toStringArray(payload.participants ?? []),
    questionId,
    questionTitle: normaliseString(payload.question?.title) ?? questionId,
    difficulty: normaliseString(payload.question?.difficulty) ?? undefined,
    topics: toStringArray(payload.question?.topics ?? []),
    timeLimit:
      typeof payload.question?.timeLimit === "number"
        ? payload.question?.timeLimit
        : undefined,
    language: normaliseString(payload.language) ?? undefined,
    code: typeof payload.code === "string" ? payload.code : "",
    sessionEndedAt: payload.sessionEndedAt
      ? new Date(payload.sessionEndedAt)
      : undefined,
    sessionStartedAt: payload.sessionStartedAt
      ? new Date(payload.sessionStartedAt)
      : undefined,
    durationMs:
      typeof payload.durationMs === "number" &&
      Number.isFinite(payload.durationMs)
        ? Math.max(0, payload.durationMs)
        : undefined,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : undefined,
  };
};

function getEntryTimestamp(entry: HistoryEntry): number {
  return (
    entry.sessionEndedAt?.getTime() ??
    entry.updatedAt?.getTime() ??
    entry.createdAt?.getTime() ??
    0
  );
}

export async function fetchHistoryEntries(
  options: {
    userId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<HistoryEntry[]> {
  const params = new URLSearchParams();
  if (options.userId) {
    params.set("userId", options.userId);
  }

  const url =
    HISTORY_SERVICE_BASE_URL +
    "/history" +
    (params.size > 0 ? `?${params.toString()}` : "");

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `History request failed (${response.status}): ${
        text || response.statusText
      }`,
    );
  }

  const data: HistoryApiResponse = await response.json();

  if (data.success === false) {
    throw new Error(data.error ?? "Failed to fetch history entries");
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const entries = items.map(mapToHistoryEntry);

  const latestByQuestionId = new Map<string, HistoryEntry>();
  for (const entry of entries) {
    if (!entry.questionId) {
      continue;
    }
    const existing = latestByQuestionId.get(entry.questionId);
    if (!existing || getEntryTimestamp(entry) > getEntryTimestamp(existing)) {
      latestByQuestionId.set(entry.questionId, entry);
    }
  }

  return Array.from(latestByQuestionId.values()).sort(
    (a, b) => getEntryTimestamp(b) - getEntryTimestamp(a),
  );
}

export { HISTORY_SERVICE_BASE_URL };
