import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import * as Y from "yjs";
import { encodeUpdate } from "./yjsHelpers";
const DEFAULT_LANGUAGE = "javascript";

interface CreateDocUpdateHandlerArgs {
  sessionId: string;
  text: Y.Text;
  latestCodeRef: MutableRefObject<string>;
  queueLocalSave: (value: string) => void;
  socket: Socket;
  currentUserId?: string;
}

export const createDocUpdateHandler = ({
  sessionId,
  text,
  latestCodeRef,
  queueLocalSave,
  socket,
  currentUserId,
}: CreateDocUpdateHandlerArgs) => {
  return (
    update: Uint8Array,
    _origin: unknown,
    _doc: Y.Doc,
    transaction: Y.Transaction,
  ) => {
    console.log("[CollabEditor] Doc update fired", {
      sessionId,
      local: transaction.local,
      size: update.length,
    });

    const content = text.toString();
    latestCodeRef.current = content;
    queueLocalSave(content);

    if (!transaction.local) {
      return;
    }

    const encoded = encodeUpdate(update);
    console.log("[CollabEditor] Emitting yjsUpdate", {
      sessionId,
      userId: currentUserId,
      size: update.length,
    });
    socket.emit("yjsUpdate", {
      sessionId,
      update: encoded,
      language: DEFAULT_LANGUAGE,
      userId: currentUserId,
    });
  };
};
