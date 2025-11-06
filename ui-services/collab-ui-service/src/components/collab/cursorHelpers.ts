import type { editor as MonacoEditor } from "monaco-editor";
import type { Awareness } from "y-protocols/awareness";
import type { RemoteCursorManager } from "@convergencelabs/monaco-collab-ext";

type CursorIdMap = Map<number, string>;

export const clearRemoteCursors = (
  manager: RemoteCursorManager | null,
  cursorIds: CursorIdMap,
) => {
  if (!manager) {
    cursorIds.clear();
    return;
  }

  cursorIds.forEach((cursorId) => {
    try {
      manager.removeCursor(cursorId);
    } catch (error) {
      console.warn("[cursorHelpers] Failed to remove remote cursor", {
        cursorId,
        error,
      });
    }
  });

  cursorIds.clear();
};

export const syncRemoteCursors = (
  awareness: Awareness | null,
  manager: RemoteCursorManager | null,
  cursorIds: CursorIdMap,
  randomColorForUser: (userId: string) => string,
) => {
  if (!awareness || !manager) {
    return;
  }

  const localClientId = awareness.clientID;
  const activeClientIds = new Set<number>();

  awareness.getStates().forEach((state, clientId) => {
    if (clientId === localClientId) {
      return;
    }

    const cursorState = state?.cursor;
    const userState = state?.user;

    const hasOffset = typeof cursorState?.offset === "number";
    const hasPosition =
      typeof cursorState?.position?.lineNumber === "number" &&
      typeof cursorState?.position?.column === "number";

    if (!cursorState || (!hasOffset && !hasPosition)) {
      const existingId = cursorIds.get(clientId);
      if (existingId) {
        manager.removeCursor(existingId);
        cursorIds.delete(clientId);
      }
      return;
    }

    const cursorId = cursorIds.get(clientId) ?? `${clientId}`;

    if (!cursorIds.has(clientId)) {
      const baseUserId =
        typeof userState?.id === "string"
          ? userState.id
          : typeof userState?.name === "string"
            ? userState.name
            : `${clientId}`;
      const color =
        typeof userState?.color === "string"
          ? userState.color
          : randomColorForUser(baseUserId);
      const label =
        typeof userState?.name === "string"
          ? userState.name
          : typeof userState?.id === "string"
            ? userState.id
            : baseUserId;

      try {
        manager.addCursor(cursorId, color, label);
      } catch (error) {
        console.warn("[cursorHelpers] Failed to add remote cursor", {
          clientId,
          error,
        });
        return;
      }

      cursorIds.set(clientId, cursorId);
    }

    if (hasOffset) {
      manager.setCursorOffset(cursorId, cursorState.offset);
    } else if (hasPosition) {
      manager.setCursorPosition(cursorId, cursorState.position);
    }

    manager.showCursor(cursorId);
    activeClientIds.add(clientId);
  });

  const staleClients: number[] = [];
  cursorIds.forEach((cursorId, clientId) => {
    if (!activeClientIds.has(clientId)) {
      manager.removeCursor(cursorId);
      staleClients.push(clientId);
    }
  });

  staleClients.forEach((clientId) => {
    cursorIds.delete(clientId);
  });
};

export const clearLocalCursorState = (awareness: Awareness | null) => {
  if (!awareness) {
    return;
  }
  awareness.setLocalStateField("cursor", null);
  awareness.setLocalStateField("selection", null);
};

export const publishLocalCursorState = (
  awareness: Awareness | null,
  editor: MonacoEditor.IStandaloneCodeEditor | null,
) => {
  if (!awareness || !editor) {
    return;
  }

  const model = editor.getModel();
  const position = editor.getPosition();

  if (!model || !position) {
    clearLocalCursorState(awareness);
    return;
  }

  const offset = model.getOffsetAt(position);
  awareness.setLocalStateField("cursor", {
    offset,
    position,
  });

  const selection = editor.getSelection();
  if (selection) {
    const start = model.getOffsetAt(selection.getStartPosition());
    const end = model.getOffsetAt(selection.getEndPosition());
    if (start !== end) {
      awareness.setLocalStateField("selection", {
        anchor: start,
        head: end,
      });
    } else {
      awareness.setLocalStateField("selection", null);
    }
  }
};
