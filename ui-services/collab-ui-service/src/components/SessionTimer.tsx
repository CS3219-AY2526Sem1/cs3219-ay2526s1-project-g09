import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { collabApiFetch } from "@/api/collabService";

interface SessionTimerProps {
  initialTimeInSeconds?: number;
  sessionId: string;
}

interface SessionResponse {
  success?: boolean;
  session?: SessionDetails;
  error?: string;
}

interface SessionDetails {
  createdAt?: string;
  endedAt?: string | null;
  timeTaken?: number;
  question?: {
    timeLimit?: number;
  };
}

const retrieveSessionDetails = async (
  sessionId: string,
): Promise<SessionDetails> => {
  const res = await collabApiFetch(sessionId, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch collaboration session (${res.status}): ${errorText}`,
    );
  }

  const data = (await res.json()) as SessionResponse | SessionDetails;

  if ("session" in data && data.session) {
    return data.session;
  }

  return data as SessionDetails;
};

const SessionTimer: React.FC<SessionTimerProps> = ({
  initialTimeInSeconds = 300,
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
      const res = await collabApiFetch("disconnect/system", {
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
        const session = await retrieveSessionDetails(sessionId);

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

        const limitSeconds =
          session.question?.timeLimit ?? initialTimeInSeconds;
        const timeLimit = limitSeconds * 60;

        let initialRemaining = Math.max(0, timeLimit - elapsedSeconds);

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
