import type { HistorySnapshot } from "@/types/history";

const isDev = import.meta.env.VITE_MODE === "dev";

const HISTORY_BASE_URL = isDev
  ? "http://localhost:5278"
  : "https://d2zqikej7k9p0j.cloudfront.net";

const HISTORY_SERVICE_BASE_URL = HISTORY_BASE_URL + "/api/v1/history-service";

interface HistorySnapshotPayload {
  _id?: string;
  id?: string;
  sessionId?: string;
  userId?: string;
  questionId?: string;
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
  sessionEndedAt?: string | number | Date;
  sessionStartedAt?: string | number | Date;
  durationMs?: number;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  timeLimit?: number;
}

export type HistorySnapshotInput =
  | HistorySnapshotPayload
  | HistorySnapshot
  | Record<string, unknown>
  | null
  | undefined;

export function normaliseHistorySnapshot(
  payload: HistorySnapshotInput,
): HistorySnapshot | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as HistorySnapshotPayload;

  const toString = (input: unknown): string | undefined => {
    if (typeof input === "string" && input.trim().length > 0) {
      return input.trim();
    }
    return undefined;
  };

  const toNumber = (input: unknown): number | undefined => {
    if (typeof input === "number" && Number.isFinite(input)) {
      return input;
    }
    return undefined;
  };

  const toStringArray = (input: unknown): string[] => {
    if (!Array.isArray(input)) {
      return [];
    }
    return input
      .map((item) => toString(item))
      .filter((item): item is string => typeof item === "string");
  };

  const toDate = (input: unknown): Date | undefined => {
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? undefined : input;
    }
    if (typeof input === "string" || typeof input === "number") {
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return undefined;
  };

  const sessionId = toString(value.sessionId) ?? "";
  const userId = toString(value.userId) ?? "";
  const questionId =
    toString(value.question?.questionId ?? value.questionId) ?? "";
  const id = toString(value._id ?? value.id) ?? `${sessionId}:${userId}`;

  if (!id || !sessionId || !userId || !questionId) {
    return null;
  }

  return {
    id,
    sessionId,
    userId,
    questionId,
    questionTitle: toString(value.question?.title) ?? "Untitled Question",
    difficulty: toString(value.question?.difficulty) ?? undefined,
    topics: toStringArray(value.question?.topics ?? []),
    timeLimit:
      toNumber(value.timeLimit ?? value.question?.timeLimit) ?? undefined,
    language: toString(value.language) ?? undefined,
    participants: toStringArray(value.participants ?? []),
    code: typeof value.code === "string" ? value.code : "",
    sessionEndedAt: toDate(value.sessionEndedAt),
    sessionStartedAt: toDate(value.sessionStartedAt),
    durationMs: (() => {
      const duration = toNumber(value.durationMs);
      return typeof duration === "number" && duration >= 0
        ? duration
        : undefined;
    })(),
    createdAt: toDate(value.createdAt),
    updatedAt: toDate(value.updatedAt),
  };
}

export async function fetchHistorySnapshot(
  id: string,
  signal?: AbortSignal,
): Promise<HistorySnapshot> {
  const response = await fetch(
    `${HISTORY_SERVICE_BASE_URL}/history/${encodeURIComponent(id)}`,
    {
      signal,
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `History request failed (${response.status}): ${
        text || response.statusText
      }`,
    );
  }

  const data = await response.json();
  if (!data || data.success === false || !data.snapshot) {
    throw new Error(data?.error ?? "History snapshot not found");
  }

  const normalised = normaliseHistorySnapshot(data.snapshot);
  if (!normalised) {
    throw new Error("Received invalid history snapshot");
  }

  return normalised;
}

export interface HistoryListQuery {
  sessionId?: string | null;
  userId?: string | null;
  questionId?: string | null;
  limit?: number;
  skip?: number;
}

export interface HistoryListResult {
  items: HistorySnapshot[];
  total: number;
  limit: number;
  skip: number;
}

export async function fetchHistorySnapshots(
  query: HistoryListQuery = {},
  signal?: AbortSignal,
): Promise<HistoryListResult> {
  const url = new URL(`${HISTORY_SERVICE_BASE_URL}/history`);
  const params = new URLSearchParams();

  const appendStringParam = (key: keyof HistoryListQuery) => {
    const value = query[key];
    if (typeof value === "string" && value.trim().length > 0) {
      params.set(key, value.trim());
    }
  };

  appendStringParam("sessionId");
  appendStringParam("userId");
  appendStringParam("questionId");

  if (
    typeof query.limit === "number" &&
    Number.isFinite(query.limit) &&
    query.limit > 0
  ) {
    params.set("limit", String(Math.floor(query.limit)));
  }

  if (
    typeof query.skip === "number" &&
    Number.isFinite(query.skip) &&
    query.skip >= 0
  ) {
    params.set("skip", String(Math.max(0, Math.floor(query.skip))));
  }

  const queryString = params.toString();
  const endpoint = queryString
    ? `${url.toString()}?${queryString}`
    : url.toString();

  const response = await fetch(endpoint, {
    signal,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `History request failed (${response.status}): ${
        text || response.statusText
      }`,
    );
  }

  const data = await response.json();
  if (!data || data.success === false) {
    throw new Error(data?.error ?? "Failed to fetch history snapshots");
  }

  const items = Array.isArray(data.items)
    ? data.items
        .map((item: unknown) =>
          normaliseHistorySnapshot(item as HistorySnapshotInput),
        )
        .filter(
          (snapshot: HistorySnapshot | null): snapshot is HistorySnapshot =>
            snapshot !== null,
        )
    : [];

  return {
    items,
    total:
      typeof data.total === "number" && Number.isFinite(data.total)
        ? data.total
        : items.length,
    limit:
      typeof data.limit === "number" && Number.isFinite(data.limit)
        ? data.limit
        : (query.limit ?? items.length),
    skip:
      typeof data.skip === "number" && Number.isFinite(data.skip)
        ? data.skip
        : (query.skip ?? 0),
  };
}

export interface UpdateHistorySnapshotPayload {
  code?: string;
  language?: string;
  sessionEndedAt?: string | number | Date | null;
  metadata?: Record<string, unknown>;
}

export async function updateHistorySnapshot(
  id: string,
  payload: UpdateHistorySnapshotPayload,
  signal?: AbortSignal,
): Promise<HistorySnapshot> {
  const response = await fetch(
    `${HISTORY_SERVICE_BASE_URL}/history/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    },
  );

  if (!response.ok) {
    let message: string | undefined;
    try {
      const data = await response.json();
      message = data?.error;
    } catch {
      message = await response.text().catch(() => undefined);
    }
    throw new Error(
      message ||
        `History update failed (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (!data || data.success === false || !data.snapshot) {
    throw new Error(data?.error ?? "History snapshot update failed");
  }

  const normalised = normaliseHistorySnapshot(data.snapshot);
  if (!normalised) {
    throw new Error("Received invalid history snapshot");
  }

  return normalised;
}

export { HISTORY_SERVICE_BASE_URL };
