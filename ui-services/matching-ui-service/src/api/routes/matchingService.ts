import type {
  UserPreferences,
  MatchingResponse,
  PreferenceResult,
  MatchResult,
  MatchAcceptanceResponse,
  TimeoutConfig,
} from "../dto/matching.dto";

import {
  MATCHING_API_BASE,
  safeFetch,
  handleMatchResponse,
  handlePreferenceResponse,
} from "../helpers/apiHelpers";

export type {
  MatchResult,
  MatchingResponse,
  UserPreferences,
  TimeoutConfig,
  MatchDetails,
} from "../dto/matching.dto";

// ---------- Matching Routes ----------

export async function requestMatch(
  preferences: UserPreferences,
): Promise<MatchResult> {
  const url = `${MATCHING_API_BASE}/match-requests`;
  const { status, data, error } = await safeFetch<MatchingResponse>(url, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
  return handleMatchResponse(status, data, error);
}

export async function cancelMatch(
  userId: string,
): Promise<null | { status: string; error: unknown }> {
  const url = `${MATCHING_API_BASE}/match-requests/${userId}`;
  const { status, error } = await safeFetch(url, { method: "DELETE" });
  return status >= 200 && status < 300 ? null : { status: "error", error };
}

export async function connectMatch(
  userId: string,
  matchId: string,
): Promise<MatchAcceptanceResponse> {
  const url = `${MATCHING_API_BASE}/match-requests/${userId}/connect`;
  const { status, data, error } = await safeFetch<MatchAcceptanceResponse>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ matchId }),
    },
  );

  const allowed = [200, 409, 410];
  if (!allowed.includes(status)) {
    throw new Error(`Unexpected HTTP status: ${status}`);
  }
  if (!data) throw error ?? new Error("Failed to connect to match");
  return data;
}

export async function acceptMatch(
  userId: string,
  matchId: string,
): Promise<MatchAcceptanceResponse> {
  const url = `${MATCHING_API_BASE}/match-requests/${userId}/accept`;
  const { status, data, error } = await safeFetch<MatchAcceptanceResponse>(
    url,
    {
      method: "PUT",
      body: JSON.stringify({ matchId }),
    },
  );

  if (status !== 200 && status !== 409) throw new Error(`HTTP error ${status}`);
  if (!data) throw error ?? new Error("Failed to accept match");
  return data;
}

export async function rejectMatch(
  userId: string,
  matchId: string,
): Promise<void> {
  const url = `${MATCHING_API_BASE}/match-requests/${userId}/reject`;
  const { status } = await safeFetch(url, {
    method: "PUT",
    body: JSON.stringify({ matchId }),
  });
  if (status < 200 || status >= 300) throw new Error(`HTTP error ${status}`);
}

// ---------- Preference Routes ----------

export async function requestPreference(
  userId: string,
): Promise<PreferenceResult> {
  const url = `${MATCHING_API_BASE}/preferences/${userId}`;
  const { status, data, error } = await safeFetch<UserPreferences>(url);
  return handlePreferenceResponse(status, data, error);
}

export async function createPreference(
  userId: string,
  preferences: UserPreferences,
): Promise<PreferenceResult> {
  const url = `${MATCHING_API_BASE}/preferences/${userId}`;
  const { status, data, error } = await safeFetch<UserPreferences>(url, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
  return handlePreferenceResponse(status, data, error);
}

// ---------- Config Route ----------

export async function getTimeoutConfig(): Promise<TimeoutConfig> {
  const url = `${MATCHING_API_BASE}/config`;
  const { data, error } = await safeFetch<TimeoutConfig>(url);

  if (!data) {
    console.warn("Failed to fetch timeout config:", error);
    return {
      matchRequestTimeout: 30_000,
      matchAcceptanceTimeout: 30_000,
    };
  }
  return data;
}
