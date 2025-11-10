import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { Socket } from "socket.io-client";
import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness";
import { MonacoBinding } from "y-monaco";
import { encodeUpdate } from "./yjsHelpers";
import { DEFAULT_LANGUAGE } from "./CollabEditor";
import { collabApiFetch } from "@/api/collabService";

interface RebindEditorParams {
  editorRef: MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  docRef: MutableRefObject<Y.Doc | null>;
  awarenessRef: MutableRefObject<Awareness | null>;
  bindingRef: MutableRefObject<MonacoBinding | null>;
  destroyBinding: () => void;
  publishLocalCursorState: () => void;
  syncRemoteCursors: () => void;
  randomColorForUser: (userId: string) => string;
  currentUserId?: string;
  activeSessionRef: MutableRefObject<string | null>;
  socket: Socket;
}

export const rebindEditor = ({
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
}: RebindEditorParams) => {
  const editor = editorRef.current;
  const doc = docRef.current;
  if (!editor || !doc) return;

  const model = editor.getModel();
  if (!model) return;

  destroyBinding();

  let awareness = awarenessRef.current as Awareness | null;
  if (!awareness) {
    awareness = new Awareness(doc);
    awarenessRef.current = awareness;

    awareness.on(
      "update",
      (
        {
          added,
          updated,
          removed,
        }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin === socket) {
          syncRemoteCursors();
          return;
        }
        const update = encodeAwarenessUpdate(awareness as Awareness, [
          ...added,
          ...updated,
          ...removed,
        ]);
        const encoded = encodeUpdate(update);
        socket.emit("awarenessUpdate", {
          sessionId: activeSessionRef.current,
          update: encoded,
        });
      },
    );
  }

  if (currentUserId && awareness) {
    const color = randomColorForUser(currentUserId);
    const userState = {
      id: currentUserId,
      name: currentUserId,
      color,
    };
    awareness.setLocalStateField("user", userState);
    console.log("[CollabEditor] Local awareness set:", userState);
  } else {
    awareness?.setLocalState(null);
  }

  const text = doc.getText("source");
  bindingRef.current = new MonacoBinding(
    text,
    model,
    new Set([editor]),
    awareness ?? undefined,
  );
  console.log("[CollabEditor] MonacoBinding updated", {
    sessionId: activeSessionRef.current,
    socketId: socket.id,
  });
  publishLocalCursorState();
  syncRemoteCursors();
};

interface HandleSessionLeaveParams {
  currentUserId?: string;
  sessionId: string | null;
  initialSessionId: string | null | undefined;
  getCurrentCode: () => string;
  setSessionEnded: Dispatch<SetStateAction<boolean>>;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  setSessionEndedMessage: Dispatch<SetStateAction<string | null>>;
}

export const handleSessionLeave = async ({
  currentUserId,
  sessionId,
  initialSessionId,
  getCurrentCode,
  setSessionEnded,
  setSessionId,
  setSessionEndedMessage,
}: HandleSessionLeaveParams) => {
  try {
    const effectiveSessionId = sessionId ?? initialSessionId ?? null;
    if (effectiveSessionId) {
      const targetUser = currentUserId ?? "unknown-user";
      const finalCode = getCurrentCode();
      const res = await collabApiFetch(
        `disconnect/${encodeURIComponent(targetUser)}`,
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
};

export const registerLeaveEventListener = (
  handler: () => Promise<void> | void,
) => {
  const onLeave = () => {
    void handler();
  };

  window.addEventListener("collab:leave-session", onLeave);

  return () => {
    window.removeEventListener("collab:leave-session", onLeave);
  };
};
