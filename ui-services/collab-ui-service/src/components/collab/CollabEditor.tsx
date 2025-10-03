import React, { useCallback, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";

const socket = io("http://localhost:5276");

interface CollabEditorProps {
  questionId?: string;
  users?: string[];
  sessionId?: string | null;
}

const CollabEditor: React.FC<CollabEditorProps> = ({
  questionId,
  users = [],
  sessionId: initialSessionId,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [code, setCode] = useState("// Start coding here!\n");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndedMessage, setSessionEndedMessage] = useState<string | null>(
    null,
  );

  const handleSessionLeave = useCallback(async () => {
    try {
      if (sessionId) {
        const res = await fetch("http://localhost:5276/api/collab/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

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
  }, [sessionId]);

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

    setSessionId(initialSessionId);
    setSessionEnded(false);
    setSessionEndedMessage(null);
    socket.emit("joinRoom", initialSessionId);
  }, [initialSessionId]);

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
      setSessionEndedMessage(
        "Your partner has left the session. Please return to Matching to start a new one.",
      );
    };

    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("sessionEnded", handleSessionEnded);

    return () => {
      socket.off("codeUpdate", handleCodeUpdate);
      socket.off("sessionEnded", handleSessionEnded);
    };
  }, [sessionId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && sessionId && !sessionEnded) {
      setCode(value);
      socket.emit("codeUpdate", { sessionId, newCode: value });
    }
  };

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        defaultLanguage="java"
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{ minimap: { enabled: false }, readOnly: sessionEnded }}
      />

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
