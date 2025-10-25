import type {
  ActiveSessionResponse,
  CollabSession,
  ConnectSessionResponse,
  StartSessionPayload,
  StartSessionResponse,
} from "../dto/collab.dto";
import { COLLAB_API_BASE } from "../helpers/apiHelpers";

const collabApiBase = COLLAB_API_BASE.endsWith("/")
  ? COLLAB_API_BASE
  : `${COLLAB_API_BASE}/`;

export type { CollabSession } from "../dto/collab.dto";

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

export async function getActiveSessionForUser(
  userId: string,
): Promise<CollabSession | null> {
  const response = await fetch(
    `${collabApiBase}sessions/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

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

export async function connectToSession(
  userId: string,
  sessionId: string,
): Promise<CollabSession> {
  const response = await fetch(
    `${collabApiBase}connect/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }))) as ConnectSessionResponse;
    throw new Error(
      errorBody.error ??
        `Failed to connect to session ${sessionId} (${response.status})`,
    );
  }

  const data = (await response.json()) as ConnectSessionResponse;
  if (!data.session) {
    throw new Error("Connect session response missing session data");
  }

  return data.session;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForActiveSession(
  userId: string,
  { attempts = 10, intervalMs = 750 } = {},
): Promise<CollabSession> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const session = await getActiveSessionForUser(userId);
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
