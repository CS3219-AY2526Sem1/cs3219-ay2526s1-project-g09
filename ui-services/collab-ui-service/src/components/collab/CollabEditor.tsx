import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import io from "socket.io-client";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { MonacoBinding } from "y-monaco";
import { COLLAB_API_URL, SOCKET_BASE_URL } from "@/api/collabService";

type DestroyableAwareness = Awareness & { destroy?: () => void };

const socket = io(SOCKET_BASE_URL, {
  path: "/api/v1/collab-service/socket.io",
  transports: ["websocket"],
});

const HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_LANGUAGE = "javascript";
const DEFAULT_BOOTSTRAP_CODE = "// Start coding here!\n";

const encodeUpdate = (update: Uint8Array) => {
  let binary = "";
  update.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeUpdate = (encoded: unknown) => {
  if (encoded instanceof Uint8Array) {
    return encoded;
  }
  if (Array.isArray(encoded)) {
    return Uint8Array.from(encoded);
  }
  if (typeof encoded !== "string") {
    return null;
  }
  try {
    const decoded = atob(encoded);
    const buffer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
      buffer[i] = decoded.charCodeAt(i);
    }
    return buffer;
  } catch (error) {
    console.warn("[CollabEditor] Failed to decode Yjs update", error);
    return null;
  }
};

const storageKeyFor = (sessionId: string | null, userId?: string | null) => {
  if (!sessionId || !userId) {
    return null;
  }
  return `collab-code:${sessionId}:${userId}`;
};

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
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndedMessage, setSessionEndedMessage] = useState<string | null>(
    null,
  );
  const [participantPrompt, setParticipantPrompt] = useState<{
    userId?: string;
    reason?: string;
  } | null>(null);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const latestCodeRef = useRef<string>(DEFAULT_BOOTSTRAP_CODE);
  const saveTimerRef = useRef<number | null>(null);
  const initialSyncTimerRef = useRef<number | null>(null);
  const hasReceivedInitialRef = useRef(false);
  const pendingInitialContentRef = useRef<string | null>(null);
  const activeSessionRef = useRef<string | null>(sessionId);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const clearInitialSyncTimer = useCallback(() => {
    if (initialSyncTimerRef.current !== null) {
      window.clearTimeout(initialSyncTimerRef.current);
      initialSyncTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    activeSessionRef.current = sessionId;
  }, [sessionId]);

  const queueLocalSave = useCallback(
    (value: string) => {
      const key = storageKeyFor(activeSessionRef.current, currentUserId);
      if (!key) {
        return;
      }
      clearSaveTimer();
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn("[CollabEditor] Failed to persist draft to storage", {
            error,
            key,
          });
        }
      }, 300);
    },
    [clearSaveTimer, currentUserId],
  );

  const getCurrentCode = useCallback(() => {
    const text = textRef.current;
    if (text) {
      return text.toString();
    }
    return latestCodeRef.current;
  }, []);

  const ensureInitialContent = useCallback((reason: string) => {
    const doc = docRef.current;
    const text = textRef.current;
    if (!doc || !text) {
      return;
    }
    if (text.length > 0) {
      return;
    }
    const pending = pendingInitialContentRef.current;
    if (!pending || pending.length === 0) {
      pendingInitialContentRef.current = null;
      return;
    }
    pendingInitialContentRef.current = null;
    doc.transact(() => {
      text.insert(0, pending);
    }, reason);
  }, []);

  const destroyBinding = useCallback(() => {
    const binding = bindingRef.current;
    bindingRef.current = null;
    if (binding && typeof binding.destroy === "function") {
      binding.destroy();
    }
  }, []);

  const rebindEditor = useCallback(() => {
    const editor = editorRef.current;
    const doc = docRef.current;
    if (!editor || !doc) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }

    destroyBinding();

    let awareness = awarenessRef.current;
    if (!awareness) {
      awareness = new Awareness(doc);
      awarenessRef.current = awareness;
    }
    if (currentUserId) {
      awareness.setLocalStateField("user", { id: currentUserId });
    } else {
      awareness.setLocalState(null);
    }

    const text = doc.getText("source");
    bindingRef.current = new MonacoBinding(
      text,
      model,
      new Set([editor]),
      awareness,
    );
  }, [currentUserId, destroyBinding]);

  const handleSessionLeave = useCallback(async () => {
    try {
      const effectiveSessionId = sessionId ?? initialSessionId ?? null;
      if (effectiveSessionId) {
        const targetUser = currentUserId ?? "unknown-user";
        const finalCode = getCurrentCode();
        const res = await fetch(
          `${COLLAB_API_URL}disconnect/${encodeURIComponent(targetUser)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              userId: currentUserId,
              force: !currentUserId,
              finalCode,
              language: DEFAULT_LANGUAGE,
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
      window.dispatchEvent(new Event("collab:leave-session-confirmed"));
      window.location.href = "/matching";
    }
  }, [currentUserId, getCurrentCode, initialSessionId, sessionId]);

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
    const intervalId = window.setInterval(() => {
      socket.emit("heartbeat");
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
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
    }
  }, [initialSessionId, questionId, sessionId, users]);

  useEffect(() => {
    if (!sessionId) {
      destroyBinding();
    }
  }, [destroyBinding, sessionId]);

  useEffect(() => {
    if (!sessionId || sessionEnded) {
      activeSessionRef.current = null;
      destroyBinding();
      if (docRef.current) {
        docRef.current.destroy();
      }
      docRef.current = null;
      textRef.current = null;
      return;
    }

    activeSessionRef.current = sessionId;

    const doc = new Y.Doc();
    doc.gc = true;
    const text = doc.getText("source");

    docRef.current = doc;
    textRef.current = text;
    latestCodeRef.current = text.toString();
    hasReceivedInitialRef.current = false;

    const storedKey = storageKeyFor(sessionId, currentUserId);
    const stored = storedKey !== null ? localStorage.getItem(storedKey) : null;
    pendingInitialContentRef.current =
      stored !== null && stored.length > 0 ? stored : DEFAULT_BOOTSTRAP_CODE;

    const handleUpdate = (
      update: Uint8Array,
      _origin: unknown,
      _doc: Y.Doc,
      transaction: Y.Transaction,
    ) => {
      const content = text.toString();
      latestCodeRef.current = content;
      queueLocalSave(content);

      if (!transaction.local) {
        return;
      }

      const encoded = encodeUpdate(update);
      socket.emit("yjsUpdate", {
        sessionId,
        update: encoded,
        language: DEFAULT_LANGUAGE,
        userId: currentUserId,
      });
    };

    doc.on("update", handleUpdate);
    rebindEditor();

    clearInitialSyncTimer();
    initialSyncTimerRef.current = window.setTimeout(() => {
      if (!hasReceivedInitialRef.current) {
        ensureInitialContent("bootstrap-timeout");
      }
    }, 1500);

    return () => {
      doc.off("update", handleUpdate);
      clearInitialSyncTimer();
      destroyBinding();
      const awareness = awarenessRef.current as DestroyableAwareness | null;
      awareness?.destroy?.();
      awarenessRef.current = null;
      doc.destroy();
      docRef.current = null;
      textRef.current = null;
      pendingInitialContentRef.current = null;
    };
  }, [
    clearInitialSyncTimer,
    currentUserId,
    destroyBinding,
    ensureInitialContent,
    queueLocalSave,
    rebindEditor,
    sessionEnded,
    sessionId,
  ]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

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

    const handleYjsInit = (payload: {
      sessionId?: string;
      update?: unknown;
    }) => {
      if (!payload?.sessionId || payload.sessionId !== sessionId) {
        return;
      }
      const update = decodeUpdate(payload.update);
      if (!update) {
        ensureInitialContent("init-fallback");
        return;
      }
      const doc = docRef.current;
      if (!doc) {
        return;
      }
      hasReceivedInitialRef.current = true;
      try {
        Y.applyUpdate(doc, update);
      } catch (error) {
        console.error("Failed to apply initial Yjs document", error);
      }
      ensureInitialContent("post-init");
    };

    const handleYjsUpdate = (payload: {
      sessionId?: string;
      update?: unknown;
    }) => {
      if (!payload?.sessionId || payload.sessionId !== sessionId) {
        return;
      }
      const doc = docRef.current;
      if (!doc) {
        return;
      }
      const update = decodeUpdate(payload.update);
      if (!update) {
        return;
      }
      try {
        Y.applyUpdate(doc, update);
      } catch (error) {
        console.error("Failed to apply remote Yjs update", error);
      }
    };

    socket.on("sessionEnded", handleSessionEnded);
    socket.on("participantLeft", handleParticipantLeft);
    socket.on("inactiveTimeout", handleInactiveTimeout);
    socket.on("yjsInit", handleYjsInit);
    socket.on("yjsUpdate", handleYjsUpdate);

    return () => {
      socket.off("sessionEnded", handleSessionEnded);
      socket.off("participantLeft", handleParticipantLeft);
      socket.off("inactiveTimeout", handleInactiveTimeout);
      socket.off("yjsInit", handleYjsInit);
      socket.off("yjsUpdate", handleYjsUpdate);
    };
  }, [ensureInitialContent, sessionId]);

  useEffect(() => {
    const awareness = awarenessRef.current;
    if (!awareness) {
      return;
    }

    if (currentUserId) {
      awareness.setLocalStateField("user", { id: currentUserId });
    } else {
      awareness.setLocalState(null);
    }
  }, [currentUserId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.updateOptions({ readOnly: sessionEnded });
  }, [sessionEnded]);

  useEffect(
    () => () => {
      clearSaveTimer();
      clearInitialSyncTimer();
      destroyBinding();
      const awareness = awarenessRef.current as DestroyableAwareness | null;
      awareness?.destroy?.();
      awarenessRef.current = null;
      if (docRef.current) {
        docRef.current.destroy();
      }
      docRef.current = null;
      textRef.current = null;
    },
    [clearInitialSyncTimer, clearSaveTimer, destroyBinding],
  );

  const handleEditorMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      editor.updateOptions({
        minimap: { enabled: false },
        readOnly: sessionEnded,
      });
      rebindEditor();
    },
    [rebindEditor, sessionEnded],
  );

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        defaultLanguage={DEFAULT_LANGUAGE}
        theme="vs-dark"
        defaultValue={DEFAULT_BOOTSTRAP_CODE}
        options={{ minimap: { enabled: false }, readOnly: sessionEnded }}
        onMount={handleEditorMount}
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
