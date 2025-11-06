import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { IDisposable, editor as MonacoEditor } from "monaco-editor";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { MonacoBinding } from "y-monaco";
import { RemoteCursorManager } from "@convergencelabs/monaco-collab-ext";
import "@convergencelabs/monaco-collab-ext/css/monaco-collab-ext.css";
import {
  clearLocalCursorState as clearLocalCursorStateHelper,
  clearRemoteCursors as clearRemoteCursorsHelper,
  publishLocalCursorState as publishLocalCursorStateHelper,
  syncRemoteCursors as syncRemoteCursorsHelper,
} from "./cursorHelpers";
import { decodeUpdate, storageKeyFor } from "./yjsHelpers";
import { createCollabSocket } from "./socketHelpers";
import { createSocketEventHandlers } from "./socketEventHandlers";
import { createDocUpdateHandler } from "./docHandlers";
import {
  handleSessionLeave as handleSessionLeaveHelper,
  rebindEditor as rebindEditorHelper,
  registerLeaveEventListener,
} from "./editorLifecycle";

type DestroyableAwareness = Awareness & { destroy?: () => void };

export const HEARTBEAT_INTERVAL_MS = 30_000;
export const DEFAULT_LANGUAGE = "javascript";
export const DEFAULT_BOOTSTRAP_CODE = "// Start coding here!\n";

const socket = createCollabSocket();

interface CollabEditorProps {
  questionId?: string;
  users?: string[];
  sessionId?: string | null;
  currentUserId?: string;
}

// Define a static palette for participant colors
const REMOTE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD166",
  "#9B5DE5",
  "#06D6A0",
  "#118AB2",
];

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
  const remoteCursorManagerRef = useRef<RemoteCursorManager | null>(null);
  const remoteCursorIdsRef = useRef<Map<number, string>>(new Map());
  const cursorDisposablesRef = useRef<IDisposable[]>([]);

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

  const randomColorForUser = useCallback((userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return REMOTE_COLORS[Math.abs(hash) % REMOTE_COLORS.length];
  }, []);

  const clearRemoteCursors = useCallback(() => {
    clearRemoteCursorsHelper(
      remoteCursorManagerRef.current,
      remoteCursorIdsRef.current,
    );
  }, []);

  const syncRemoteCursors = useCallback(() => {
    syncRemoteCursorsHelper(
      awarenessRef.current,
      remoteCursorManagerRef.current,
      remoteCursorIdsRef.current,
      randomColorForUser,
    );
  }, [randomColorForUser]);

  const clearLocalCursorState = useCallback(() => {
    clearLocalCursorStateHelper(awarenessRef.current);
  }, []);

  const publishLocalCursorState = useCallback(() => {
    publishLocalCursorStateHelper(awarenessRef.current, editorRef.current);
  }, []);

  const rebindEditor = useCallback(() => {
    rebindEditorHelper({
      editorRef,
      docRef,
      awarenessRef,
      bindingRef,
      destroyBinding,
      publishLocalCursorState,
      syncRemoteCursors,
      randomColorForUser,
      currentUserId,
      activeSessionRef,
      socket,
    });
  }, [
    currentUserId,
    destroyBinding,
    publishLocalCursorState,
    randomColorForUser,
    syncRemoteCursors,
  ]);

  const handleSessionLeave = useCallback(() => {
    return handleSessionLeaveHelper({
      currentUserId,
      sessionId,
      initialSessionId,
      getCurrentCode,
      setSessionEnded,
      setSessionId,
      setSessionEndedMessage,
    });
  }, [currentUserId, getCurrentCode, initialSessionId, sessionId]);

  useEffect(() => {
    return registerLeaveEventListener(handleSessionLeave);
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
      const awareness = awarenessRef.current;
      awareness?.setLocalState(null);
      clearLocalCursorState();
      if (docRef.current) {
        docRef.current.destroy();
      }
      docRef.current = null;
      textRef.current = null;
      clearRemoteCursors();
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

    const handleUpdate = createDocUpdateHandler({
      sessionId,
      text,
      latestCodeRef,
      queueLocalSave,
      socket,
      currentUserId,
    });

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
      const awarenessInstance =
        awarenessRef.current as DestroyableAwareness | null;
      awarenessInstance?.destroy?.();
      awarenessRef.current = null;
      doc.destroy();
      docRef.current = null;
      textRef.current = null;
      pendingInitialContentRef.current = null;
      clearRemoteCursors();
    };
  }, [
    clearInitialSyncTimer,
    currentUserId,
    clearLocalCursorState,
    destroyBinding,
    ensureInitialContent,
    clearRemoteCursors,
    queueLocalSave,
    rebindEditor,
    sessionEnded,
    sessionId,
  ]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const {
      handleSessionEnded,
      handleParticipantLeft,
      handleInactiveTimeout,
      handleYjsInit,
      handleYjsUpdate,
      handleAwarenessUpdate,
    } = createSocketEventHandlers({
      sessionId,
      socket,
      ensureInitialContent,
      rebindEditor,
      setSessionEnded,
      setSessionId,
      setParticipantPrompt,
      setSessionEndedMessage,
      decodeUpdate,
      docRef,
      hasReceivedInitialRef,
      bindingRef,
      awarenessRef,
      syncRemoteCursors,
    });

    socket.on("sessionEnded", handleSessionEnded);
    socket.on("participantLeft", handleParticipantLeft);
    socket.on("inactiveTimeout", handleInactiveTimeout);
    socket.on("yjsInit", handleYjsInit);
    socket.on("yjsUpdate", handleYjsUpdate);
    socket.on("awarenessUpdate", handleAwarenessUpdate);

    return () => {
      socket.off("sessionEnded", handleSessionEnded);
      socket.off("participantLeft", handleParticipantLeft);
      socket.off("inactiveTimeout", handleInactiveTimeout);
      socket.off("yjsInit", handleYjsInit);
      socket.off("yjsUpdate", handleYjsUpdate);
      socket.off("awarenessUpdate", handleAwarenessUpdate);
    };
  }, [
    awarenessRef,
    bindingRef,
    docRef,
    ensureInitialContent,
    hasReceivedInitialRef,
    rebindEditor,
    sessionId,
    setParticipantPrompt,
    setSessionEnded,
    setSessionEndedMessage,
    setSessionId,
    syncRemoteCursors,
  ]);

  useEffect(() => {
    const awareness = awarenessRef.current;
    if (!awareness) {
      return;
    }

    if (currentUserId) {
      const color = randomColorForUser(currentUserId);
      awareness.setLocalStateField("user", {
        id: currentUserId,
        name: currentUserId,
        color,
      });
    } else {
      awareness.setLocalState(null);
    }
  }, [currentUserId, randomColorForUser]);

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
      cursorDisposablesRef.current.forEach((disposable) => {
        disposable.dispose();
      });
      cursorDisposablesRef.current = [];
      clearRemoteCursors();
      remoteCursorManagerRef.current = null;
      const awareness = awarenessRef.current as DestroyableAwareness | null;
      awareness?.destroy?.();
      awarenessRef.current = null;
      if (docRef.current) {
        docRef.current.destroy();
      }
      docRef.current = null;
      textRef.current = null;
    },
    [clearInitialSyncTimer, clearRemoteCursors, clearSaveTimer, destroyBinding],
  );

  const handleEditorMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      editor.updateOptions({
        minimap: { enabled: false },
        readOnly: sessionEnded,
      });
      clearRemoteCursors();
      remoteCursorManagerRef.current = new RemoteCursorManager({
        editor,
        tooltips: true,
        tooltipDuration: 2,
        showTooltipOnHover: true,
      });
      cursorDisposablesRef.current.forEach((disposable) => {
        disposable.dispose();
      });
      cursorDisposablesRef.current = [
        editor.onDidChangeCursorSelection(() => {
          publishLocalCursorState();
        }),
        editor.onDidChangeCursorPosition(() => {
          publishLocalCursorState();
        }),
        editor.onDidFocusEditorWidget(() => {
          publishLocalCursorState();
        }),
        editor.onDidBlurEditorWidget(() => {
          clearLocalCursorState();
          syncRemoteCursors();
        }),
      ];
      publishLocalCursorState();
      syncRemoteCursors();
      rebindEditor();
    },
    [
      clearLocalCursorState,
      clearRemoteCursors,
      publishLocalCursorState,
      rebindEditor,
      sessionEnded,
      syncRemoteCursors,
    ],
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
