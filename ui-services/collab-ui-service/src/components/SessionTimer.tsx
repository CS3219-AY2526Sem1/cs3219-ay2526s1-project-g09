import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SessionTimerProps {
  initialTimeInSeconds?: number;
  sessionId: string;
}

interface SessionResponse {
  success?: boolean;
  session?: {
    createdAt?: string;
    endedAt?: string | null;
    timeTaken?: number;
  };
  error?: string;
}

interface SessionPayload {
  createdAt?: string;
  endedAt?: string | null;
  timeTaken?: number;
}

const rawCollabApiBase =
  import.meta.env.VITE_COLLAB_SERVICE_API_LINK ??
  "http://localhost:5276/api/v1/collab-service/";
const collabApiBase = rawCollabApiBase.endsWith("/")
  ? rawCollabApiBase
  : `${rawCollabApiBase}/`;

const retrieveStartTime = async (
  sessionId: string,
): Promise<SessionPayload> => {
  const res = await fetch(`${collabApiBase}${sessionId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch collaboration session (${res.status}): ${errorText}`,
    );
  }

  const data = (await res.json()) as SessionResponse | SessionPayload;

  if ("session" in data && data.session) {
    return data.session;
  }

  return data as SessionPayload;
};

const SessionTimer: React.FC<SessionTimerProps> = ({
  initialTimeInSeconds = 310,
  sessionId,
}) => {
  const [time, setTime] = useState(initialTimeInSeconds);
  const [loading, setLoading] = useState(true);
  const hasExpiredRef = useRef(false);

  const isLowTime = time < 300;

  const endSessionOnTimeout = useCallback(async () => {
    if (hasExpiredRef.current) {
      return;
    }

    if (!sessionId) {
      return;
    }

    hasExpiredRef.current = true;

    try {
      const res = await fetch(`${collabApiBase}disconnect/system`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, force: true }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to terminate session on timeout (${res.status}): ${errorText}`,
        );
      }
    } catch (err) {
      console.error("Failed to end session after timer expiry:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const initTimer = async () => {
      try {
        const session = await retrieveStartTime(sessionId);

        const startedAt = session.createdAt
          ? new Date(session.createdAt).getTime()
          : Number.NaN;

        if (!Number.isFinite(startedAt)) {
          throw new Error(`Invalid createdAt for session ${sessionId}`);
        }

        const now = Date.now();
        const elapsedSeconds = Math.max(
          0,
          Math.round((now - startedAt) / 1000),
        );

        let initialRemaining = Math.max(
          0,
          initialTimeInSeconds - elapsedSeconds,
        );

        if (session.timeTaken && session.timeTaken > 0) {
          initialRemaining = 0;
          hasExpiredRef.current = true;
        }

        setTime(initialRemaining);
        setLoading(false);

        timerId = setInterval(() => {
          setTime((prev) => {
            if (prev <= 1) {
              clearInterval(timerId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Failed to init timer:", err);
        setLoading(false);
      }
    };

    initTimer();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [sessionId, initialTimeInSeconds]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (time !== 0) {
      return;
    }

    void endSessionOnTimeout();
  }, [endSessionOnTimeout, loading, time]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) {
    return (
      <Button className="bg-gray-500 text-white" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <Button
      className={`
        text-white
        ${isLowTime ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-orange-700"}
      `}
    >
      {formatTime(time)}
    </Button>
  );
};

export default SessionTimer;
