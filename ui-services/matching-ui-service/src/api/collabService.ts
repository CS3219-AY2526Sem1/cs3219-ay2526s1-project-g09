export interface StartSessionPayload {
  questionId: string;
  users: string[];
  sessionId?: string;
}

export interface CollabSession {
  sessionId: string;
  questionId: string;
  users: string[];
  active: boolean;
  createdAt?: string;
  endedAt?: string;
  timeTaken?: number;
}

interface StartSessionResponse {
  success?: boolean;
  session?: CollabSession;
  error?: string;
}

interface ActiveSessionResponse {
  success?: boolean;
  session?: CollabSession;
  error?: string;
}

const rawBaseUrl =
  import.meta.env.VITE_COLLAB_SERVICE_API_LINK ??
  "http://localhost:5276/api/collab/";

const collabApiBase = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

export async function startCollabSession(
  payload: StartSessionPayload,
): Promise<CollabSession> {
  const response = await fetch(`${collabApiBase}start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }))) as StartSessionResponse;
    throw new Error(
      errorBody.error ?? `Failed to create session (${response.status})`,
    );
  }

  const data = (await response.json()) as StartSessionResponse;
  if (!data.session) {
    throw new Error(data.error ?? "Session response missing session data");
  }

  return data.session;
}

export async function findActiveSession(
  users: string[],
): Promise<CollabSession | null> {
  const response = await fetch(`${collabApiBase}active`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }))) as ActiveSessionResponse;
    throw new Error(
      errorBody.error ?? `Failed to fetch active session (${response.status})`,
    );
  }

  const data = (await response.json()) as ActiveSessionResponse;
  return data.session ?? null;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForActiveSession(
  users: string[],
  { attempts = 10, intervalMs = 750 } = {},
): Promise<CollabSession> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const session = await findActiveSession(users);
      if (session) {
        return session;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(intervalMs);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Timed out waiting for collaboration session");
}
