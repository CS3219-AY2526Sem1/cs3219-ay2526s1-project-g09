import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

interface CollabSession {
  sessionId: string;
  questionId: string;
  users?: string[];
  participants?: Array<{
    userId: string;
    active?: boolean;
    lastSeenAt?: string;
  }>;
  [key: string]: unknown;
}

interface CollabSessionState {
  loading: boolean;
  error: string | null;
  session: CollabSession | null;
  refresh: () => Promise<void>;
  isHydrated: boolean;
}

const defaultState: CollabSessionState = {
  loading: true,
  error: null,
  session: null,
  refresh: async () => {},
  isHydrated: false,
};

const CollabSessionContext = createContext<CollabSessionState>(defaultState);

const rawCollabApiBase =
  import.meta.env.VITE_COLLAB_SERVICE_API_LINK ??
  "http://localhost:5276/api/v1/collab-service/";
const collabApiBase = rawCollabApiBase.endsWith("/")
  ? rawCollabApiBase
  : `${rawCollabApiBase}/`;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

interface ProviderProps {
  currentUserId: string | null | undefined;
  children: React.ReactNode;
}

export const CollabSessionProvider: React.FC<ProviderProps> = ({
  currentUserId,
  children,
}) => {
  const [session, setSession] = useState<CollabSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSession = useCallback(async () => {
    if (!currentUserId) {
      setSession(null);
      setLoading(false);
      setError("Missing user context");
      return;
    }

    setLoading(true);
    setError(null);

    let attempts = 0;
    const maxAttempts = 10;
    let lastError: unknown = null;
    let fetchedSession: CollabSession | null = null;

    while (attempts < maxAttempts && !fetchedSession) {
      try {
        const response = await fetch(
          `${collabApiBase}sessions/${encodeURIComponent(currentUserId)}`,
        );

        if (response.status === 404) {
          attempts += 1;
          await delay(750);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to fetch session (${response.status}): ${errorBody}`,
          );
        }

        const data = (await response.json()) as {
          success?: boolean;
          session?: CollabSession;
        };

        fetchedSession =
          data.session ?? (data.success ? (data.session ?? null) : null);
      } catch (err) {
        lastError = err;
        attempts += 1;
        await delay(750);
      }
    }

    if (!fetchedSession) {
      setError(
        lastError instanceof Error
          ? lastError.message
          : "Unable to locate an active collaboration session",
      );
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const connectResponse = await fetch(
        `${collabApiBase}connect/${encodeURIComponent(currentUserId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: fetchedSession.sessionId }),
        },
      );

      if (connectResponse.ok) {
        const payload = (await connectResponse.json()) as {
          session?: CollabSession;
        };

        setSession(payload.session ?? fetchedSession);
      } else {
        setSession(fetchedSession);
      }
      setError(null);
    } catch (connectError) {
      console.error("Failed to connect to session", connectError);
      setSession(fetchedSession);
      setError(null);
    }

    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    void fetchActiveSession();
  }, [fetchActiveSession]);

  const value = useMemo(
    () => ({
      loading,
      error,
      session,
      refresh: fetchActiveSession,
      isHydrated: true,
    }),
    [loading, error, session, fetchActiveSession],
  );

  return (
    <CollabSessionContext.Provider value={value}>
      {children}
    </CollabSessionContext.Provider>
  );
};
export { CollabSessionContext };
