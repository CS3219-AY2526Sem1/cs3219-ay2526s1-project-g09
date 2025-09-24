export interface UserPreferences {
  userId: string;
  topics: string[];
  difficulties: string[];
  minTime: number;
  maxTime: number;
}

export interface MatchingResponse {
  matchedUserId?: string;
  [key: string]: any;
}

export type MatchResult =
  | { status: "found"; data: MatchingResponse }
  | { status: "notFound" }
  | { status: "error"; error: any };

export type PreferenceResult =
  | { status: "found"; data: UserPreferences }
  | { status: "notFound" }
  | { status: "error"; error: any };

async function handleResponse<T>(
  response: Response,
  notFoundStatus = 404,
): Promise<
  | { status: "found"; data: T }
  | { status: "notFound" }
  | { status: "error"; error: any }
> {
  if (response.status === notFoundStatus) {
    return { status: "notFound" };
  }

  if (!response.ok) {
    return { status: "error", error: `HTTP error ${response.status}` };
  }

  try {
    const data = (await response.json()) as T;
    return { status: "found", data };
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function requestMatch(
  preferences: UserPreferences,
): Promise<MatchResult> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}request-match/${preferences.userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    return handleResponse<MatchingResponse>(response, 202);
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function cancelMatch(
  userId: string,
): Promise<null | { status: string; error: any }> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}cancel-match/${userId}`;

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
  const uriLink = `${apiUri}${userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return handleResponse<UserPreferences>(response);
  } catch (err) {
    return { status: "error", error: err };
  }
}

export async function createPreference(
  userId: string,
  preferences: UserPreferences,
): Promise<PreferenceResult> {
  const apiUri = import.meta.env.VITE_MATCHING_SERVICE_API_LINK;
  const uriLink = `${apiUri}${userId}`;

  try {
    const response = await fetch(uriLink, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    return handleResponse<UserPreferences>(response);
  } catch (err) {
    return { status: "error", error: err };
  }
}
