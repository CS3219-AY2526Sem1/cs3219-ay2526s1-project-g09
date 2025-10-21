import type {
  MatchingResponse,
  UserPreferences,
  MatchResult,
  PreferenceResult,
} from "../dto/matching.dto";

export const MATCHING_API_BASE = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
export const QUESTION_API_BASE = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;

/**
 * Universal fetch wrapper with JSON parsing and structured result.
 * Does not throw; always returns { data, status, error }.
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data?: T; status: number; error?: unknown }> {
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = (await response.json().catch(() => undefined)) as
      | T
      | Record<string, unknown>
      | undefined;

    return response.ok
      ? { data: data as T, status: response.status }
      : { data: data as T, status: response.status, error: data };
  } catch (error) {
    return { status: 0, error };
  }
}

/**
 * Throws on HTTP error. Returns parsed JSON on success.
 */
export async function apiFetch<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const { data, status, error } = await safeFetch<T>(
    `${baseUrl}${endpoint}`,
    options,
  );

  if (status < 200 || status >= 300) {
    // Safely extract readable error message
    let message: string;
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in (error as Record<string, unknown>)
    ) {
      message = String((error as Record<string, unknown>).error);
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = `HTTP ${status} - ${options?.method ?? "GET"} ${endpoint}`;
    }

    throw new Error(message);
  }

  if (!data) throw new Error(`No data received from ${endpoint}`);
  return data;
}

/**
 * Generic typed API response handler.
 * Used by matching + preference APIs to unify response mapping.
 */
function handleApiResult<T>(
  status: number,
  data: T | undefined,
  error: unknown,
  mapping: { notFound?: number | number[]; cancelled?: number | number[] } = {},
): { status: string; data?: T; error?: unknown } {
  const isMatch = (codes?: number | number[], target?: number): boolean => {
    if (codes === undefined || target === undefined) return false;
    return Array.isArray(codes) ? codes.includes(target) : codes === target;
  };

  if (isMatch(mapping.notFound, status)) return { status: "notFound" };
  if (isMatch(mapping.cancelled, status)) return { status: "cancelled" };
  if (data) return { status: "found", data };
  return { status: "error", error: error ?? "Unknown error" };
}

/**
 * Map HTTP responses for match-related routes into typed MatchResult.
 */
export const handleMatchResponse = (
  status: number,
  data?: MatchingResponse,
  error?: unknown,
): MatchResult =>
  handleApiResult(status, data, error, {
    notFound: [404, 202],
    cancelled: 410,
  }) as MatchResult;

/**
 * Map HTTP responses for user preference routes into typed PreferenceResult.
 */
export const handlePreferenceResponse = (
  status: number,
  data?: UserPreferences,
  error?: unknown,
): PreferenceResult =>
  handleApiResult(status, data, error, {
    notFound: 404,
  }) as PreferenceResult;
