export interface UserPreferences {
  userId: string;
  topics: string[];
  difficulties: string[];
  minTime: number;
  maxTime: number;
}

export interface MatchDetails {
  userId: string;
  topics: string[];
  difficulties: string[];
  minTime: number;
  maxTime: number;
}

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

async function handleMatchResponse(response: Response): Promise<MatchResult> {
  if (response.status === 404) {
    return { status: "notFound" };
  }
  if (response.status === 410) {
    return { status: "cancelled" };
  }

  if (response.status == 202) {
    return { status: "notFound" };
  }

  if (!response.ok) {
    return { status: "error", error: `HTTP error ${response.status}` };
  }

  try {
    const data = (await response.json()) as MatchingResponse;
    return { status: "found", data };
  } catch (err) {
    return { status: "error", error: err };
  }
}

async function handlePreferenceResponse(
  response: Response,
): Promise<PreferenceResult> {
  if (response.status === 404) {
    return { status: "notFound" };
  }
  if (!response.ok) {
    return { status: "error", error: `HTTP error ${response.status}` };
  }

  try {
    const data = (await response.json()) as UserPreferences;
    return { status: "found", data };
  } catch (err) {
    return { status: "error", error: err };
  }
}
export async function requestMatch(
  preferences: UserPreferences,
): Promise<MatchResult> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}match-requests`;

  try {
    const response = await fetch(uriLink, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    return handleMatchResponse(response);
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function cancelMatch(
  userId: string,
): Promise<null | { status: string; error: unknown }> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}match-requests/${userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      return null;
    } else {
      const errorBody = await response.json().catch(() => ({}));
      return { status: "error", error: errorBody };
    }
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function requestPreference(
  userId: string,
): Promise<PreferenceResult> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}preferences/${userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return handlePreferenceResponse(response);
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function createPreference(
  userId: string,
  preferences: UserPreferences,
): Promise<PreferenceResult> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}preferences/${userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    return handlePreferenceResponse(response);
  } catch (err) {
    return { status: "error", error: err };
  }
}

export interface MatchAcceptanceResponse {
  status: "SUCCESS" | "REJECTED" | "PENDING";
  match: {
    matchId: string;
    user1Id: string;
    user2Id: string;
    questionPreference: {
      topics: string[];
      difficulties: string[];
      minTime: number;
      maxTime: number;
    };
  };
}

/**
 * Connect to matched
 */
export async function connectMatch(
  userId: string,
  matchId: string,
): Promise<MatchAcceptanceResponse> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const response = await fetch(`${apiUri}match-requests/${userId}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json() as Promise<MatchAcceptanceResponse>;
}

/**
 * Accept a match
 */
export async function acceptMatch(
  userId: string,
  matchId: string,
): Promise<MatchAcceptanceResponse> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const response = await fetch(`${apiUri}match-requests/${userId}/accept`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json() as Promise<MatchAcceptanceResponse>;
}

/**
 * Reject a match
 */
export async function rejectMatch(
  userId: string,
  matchId: string,
): Promise<void> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const response = await fetch(`${apiUri}match-requests/${userId}/reject`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
}
