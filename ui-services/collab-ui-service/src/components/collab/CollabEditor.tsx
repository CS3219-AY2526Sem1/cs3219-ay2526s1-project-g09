import React, { useCallback, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";

const socket = io("http://localhost:5276");
const HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_LANGUAGE = "java";
const rawCollabApiBase =
  import.meta.env.VITE_COLLAB_SERVICE_API_LINK ??
  "http://localhost:5276/api/v1/collab-service/";
const collabApiBase = rawCollabApiBase.endsWith("/")
  ? rawCollabApiBase
  : `${rawCollabApiBase}/`;

interface CollabEditorProps {
  questionId?: string;
  users?: string[];
  sessionId?: string | null;
  currentUserId?: string;
}

const CollabEditor: React.FC<CollabEditorProps> = ({
  questionId,
  users = [],
  sessionId: initialSessionId,
  currentUserId,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [code, setCode] = useState("// Start coding here!\n");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndedMessage, setSessionEndedMessage] = useState<string | null>(
    null,
  );
  const [participantPrompt, setParticipantPrompt] = useState<{
    userId?: string;
    reason?: string;
  } | null>(null);

  const handleSessionLeave = useCallback(async () => {
    try {
      const effectiveSessionId = sessionId ?? initialSessionId ?? null;
      if (effectiveSessionId) {
        const targetUser = currentUserId ?? "unknown-user";
        const res = await fetch(
          `${collabApiBase}disconnect/${encodeURIComponent(targetUser)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              userId: currentUserId,
              force: !currentUserId,
            }),
          },
        );

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to end collaboration session (${res.status}): ${errorText}`,
          );
        }
      }
    } catch (error) {
      console.error("Failed to end collaboration session", error);
    } finally {
      setSessionEnded(true);
      setSessionId(null);
      setSessionEndedMessage(null);
      window.location.href = "/matching";
    }
  }, [currentUserId, initialSessionId, sessionId]);

  useEffect(() => {
    const handleLeaveEvent = () => {
      void handleSessionLeave();
    };

    window.addEventListener("collab:leave-session", handleLeaveEvent);

    return () => {
      window.removeEventListener("collab:leave-session", handleLeaveEvent);
    };
  }, [handleSessionLeave]);

  useEffect(() => {
    if (!initialSessionId) {
      return;
    }

    let cancelled = false;

    const connectAndJoin = () => {
      setSessionId(initialSessionId);
      setSessionEnded(false);
      setSessionEndedMessage(null);
      setParticipantPrompt(null);

      if (cancelled) {
        return;
      }

      socket.emit("joinRoom", {
        sessionId: initialSessionId,
        userId: currentUserId,
      });
    };

    connectAndJoin();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, initialSessionId]);

  useEffect(() => {
    if (!sessionId || sessionEnded) {
      return;
    }

    socket.emit("heartbeat");
    const intervalId = setInterval(() => {
      socket.emit("heartbeat");
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, sessionEnded]);

  useEffect(() => {
    if (initialSessionId || sessionId) {
      return;
    }

    if (!questionId || users.length === 0) {
      console.warn(
        "Unable to start session: missing questionId or users",
        questionId,
        users,
      );
      return;
    }
  }, [initialSessionId, questionId, sessionId, users]);

  useEffect(() => {
    if (!sessionId) return;

    const handleCodeUpdate = (newCode: string) => {
      setCode(newCode);
    };

    const handleSessionEnded = (endedSessionId: string) => {
      if (endedSessionId !== sessionId) {
        return;
      }

      console.log("Session ended by server. Leaving editor.");
      setSessionEnded(true);
      setSessionId(null);
      setParticipantPrompt(null);
      setSessionEndedMessage(
        "This collaboration session has ended. Please return to Matching to start a new one.",
      );
    };

    const handleParticipantLeft = (payload: {
      sessionId: string;
      userId?: string;
      reason?: string;
    }) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setParticipantPrompt({
        userId: payload.userId,
        reason: payload.reason,
      });
      setSessionEndedMessage(null);
    };

    const handleInactiveTimeout = (payload: { sessionId: string }) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setSessionEnded(true);
      setSessionEndedMessage(
        "You have been removed from this session due to inactivity.",
      );
      setParticipantPrompt(null);
    };

    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("sessionEnded", handleSessionEnded);
    socket.on("participantLeft", handleParticipantLeft);
    socket.on("inactiveTimeout", handleInactiveTimeout);

    return () => {
      socket.off("codeUpdate", handleCodeUpdate);
      socket.off("sessionEnded", handleSessionEnded);
      socket.off("participantLeft", handleParticipantLeft);
      socket.off("inactiveTimeout", handleInactiveTimeout);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !currentUserId) return;
    const saved = localStorage.getItem(
      `collab-code:${sessionId}:${currentUserId}`,
    );
    if (saved !== null) {
      setCode(saved);
    }
  }, [sessionId, currentUserId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && sessionId && !sessionEnded) {
      setCode(value);
      localStorage.setItem(`collab-code:${sessionId}:${currentUserId}`, value);
      socket.emit("codeUpdate", {
        sessionId,
        newCode: value,
        language: DEFAULT_LANGUAGE,
      });
    }
  };

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        defaultLanguage={DEFAULT_LANGUAGE}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{ minimap: { enabled: false }, readOnly: sessionEnded }}
      />

      {participantPrompt && !sessionEnded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-white p-6 text-center">
          <p className="text-xl font-semibold">
            {participantPrompt.reason === "inactivity"
              ? participantPrompt.userId
                ? `${participantPrompt.userId} became inactive.`
                : "Your partner became inactive."
              : participantPrompt.userId
                ? `${participantPrompt.userId} has left the session.`
                : "Your partner has left the session."}
          </p>
          <p className="text-base text-white/80">
            Would you like to continue working alone or end the session?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-2 rounded bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setParticipantPrompt(null);
              }}
            >
              Continue Session
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded border border-white/60 hover:bg-white/10"
              onClick={() => {
                setParticipantPrompt(null);
                void handleSessionLeave();
              }}
            >
              Leave Session
            </button>
          </div>
        </div>
      )}

      {sessionEndedMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-white p-6 text-center">
          <p className="text-xl font-semibold">{sessionEndedMessage}</p>
          <button
            type="button"
            className="px-6 py-2 rounded bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              window.location.href = "/matching";
            }}
          >
            Return to Matching
          </button>
        </div>
      )}
    </div>
  );
};

export default CollabEditor;
