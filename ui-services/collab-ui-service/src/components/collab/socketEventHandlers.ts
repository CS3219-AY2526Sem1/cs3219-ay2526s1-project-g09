import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Socket } from "socket.io-client";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { applyAwarenessUpdate } from "y-protocols/awareness";
import type { MonacoBinding } from "y-monaco";

interface ParticipantPromptState {
  userId?: string;
  reason?: string;
}

interface CreateSocketEventHandlersArgs {
  sessionId: string;
  socket: Socket;
  ensureInitialContent: (reason: string) => void;
  rebindEditor: () => void;
  setSessionEnded: Dispatch<SetStateAction<boolean>>;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  setParticipantPrompt: Dispatch<SetStateAction<ParticipantPromptState | null>>;
  setSessionEndedMessage: Dispatch<SetStateAction<string | null>>;
  decodeUpdate: (payload: unknown) => Uint8Array | null;
  docRef: MutableRefObject<Y.Doc | null>;
  hasReceivedInitialRef: MutableRefObject<boolean>;
  bindingRef: MutableRefObject<MonacoBinding | null>;
  awarenessRef: MutableRefObject<Awareness | null>;
  syncRemoteCursors: () => void;
}

export const createSocketEventHandlers = ({
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
}: CreateSocketEventHandlersArgs) => {
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

  const handleYjsInit = (payload: { sessionId?: string; update?: unknown }) => {
    if (!payload?.sessionId || payload.sessionId !== sessionId) {
      return;
    }
    console.log("[CollabEditor] Received yjsInit", {
      sessionId,
      hasUpdate: Boolean(payload.update),
    });
    const update = decodeUpdate(payload.update);
    if (!update) {
      console.warn("[CollabEditor] yjsInit missing update payload");
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
      console.log("[CollabEditor] Applied yjsInit update", {
        sessionId,
        size: update.length,
      });
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
    console.log("[CollabEditor] Received yjsUpdate", {
      sessionId,
      from: payload.sessionId ?? "unknown",
    });
    const doc = docRef.current;
    if (!doc) {
      return;
    }
    const update = decodeUpdate(payload.update);
    if (!update) {
      console.warn("[CollabEditor] Skipped yjsUpdate: invalid payload");
      return;
    }
    try {
      Y.applyUpdate(doc, update);
      console.log("[CollabEditor] Applied remote yjsUpdate", {
        sessionId,
        size: update.length,
      });
      if (!bindingRef.current) {
        console.warn(
          "[CollabEditor] Missing Monaco binding after remote update; reinitialising.",
        );
        rebindEditor();
      }
    } catch (error) {
      console.error("Failed to apply remote Yjs update", error);
    }
  };

  const handleAwarenessUpdate = (payload: {
    sessionId?: string;
    update?: unknown;
  }) => {
    if (!payload?.sessionId || payload.sessionId !== sessionId) {
      return;
    }
    const awareness = awarenessRef.current;
    if (!awareness) {
      return;
    }
    const update = decodeUpdate(payload.update);
    if (!update) {
      console.warn("[CollabEditor] Skipped awarenessUpdate: invalid payload");
      return;
    }
    applyAwarenessUpdate(awareness, update, socket);
    syncRemoteCursors();
  };

  return {
    handleSessionEnded,
    handleParticipantLeft,
    handleInactiveTimeout,
    handleYjsInit,
    handleYjsUpdate,
    handleAwarenessUpdate,
  };
};
