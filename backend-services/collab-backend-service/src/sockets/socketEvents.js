import {
  ensureSessionDoc,
  refreshSocketActivity,
  disconnectTimers,
  getSessionSnapshot,
  clearSessionCodeCache,
} from "./yjsSync.js";
import {
  encodeUpdateToBase64,
  decodeUpdateFromBase64,
  getParticipantIds,
  normaliseLanguage,
} from "../utils/session.utils.js";
import * as Y from "yjs";
import SessionService from "../services/session.service.js";
import { persistSessionHistory } from "../services/sessionHistory.service.js";

const DEFAULT_LANGUAGE = "javascript";

export const connectSocketEvent = (socket) => {
  console.log("connected", socket.id);
};

export const createSessionEvent = (s) => {
  console.log("got sessionCreated:", s);
};

export const joinRoomEvent = (socket) => {
  // sessionId and userId passed from frontend
  socket.on("joinRoom", (payload) => {
    const normalizedPayload =
      typeof payload === "string" ? { sessionId: payload } : (payload ?? {});
    const { sessionId, userId } = normalizedPayload;

    if (!sessionId) {
      console.warn(
        `Socket ${socket.id} attempted to join room without sessionId`,
      );
      return;
    }

    socket.join(sessionId);
    socket.data.sessionId = sessionId;

    const docEntry = ensureSessionDoc(sessionId);
    if (docEntry) {
      const encodedState = encodeUpdateToBase64(
        Y.encodeStateAsUpdate(docEntry.doc),
      );
      socket.emit("yjsInit", {
        sessionId,
        update: encodedState,
        language: docEntry.language ?? DEFAULT_LANGUAGE,
      });
      console.log("Sent yjsInit", {
        socketId: socket.id,
        sessionId,
        byteLength: encodedState?.length ?? 0,
      });
      const currentContent = docEntry.text.toString();
      if (typeof currentContent === "string") {
        socket.data.latestCode = currentContent;
      }
      socket.data.latestLanguage =
        docEntry.language ?? socket.data.latestLanguage ?? DEFAULT_LANGUAGE;
    } else if (!socket.data.latestLanguage) {
      socket.data.latestLanguage = DEFAULT_LANGUAGE;
    }

    if (typeof userId === "string" && userId.trim().length > 0) {
      socket.data.userId = userId.trim();
    }

    if (socket.data.userId) {
      const timerKey = `${sessionId}:${socket.data.userId}`;
      const timer = disconnectTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(timerKey);
      }
    }

    refreshSocketActivity(socket);

    console.log(
      `User ${socket.id} joined room ${sessionId}${
        socket.data.userId ? ` as ${socket.data.userId}` : ""
      }`,
    );
    console.log("joinRoom", {
      socketId: socket.id,
      sessionId,
      userId: socket.data.userId,
    });
  });
};

export const codeUpdateEvent = (socket) => {
  socket.on("codeUpdate", ({ sessionId, newCode, language }) => {
    if (!sessionId || typeof newCode !== "string") {
      return;
    }

    refreshSocketActivity(socket, { persist: false });
    const resolvedLanguage =
      normaliseLanguage(language) ??
      socket.data.latestLanguage ??
      DEFAULT_LANGUAGE;

    socket.data.latestCode = newCode;
    socket.data.latestLanguage = resolvedLanguage;

    const docEntry = ensureSessionDoc(sessionId);
    if (docEntry) {
      docEntry.lastAuthor = socket.data.userId;
      docEntry.language = resolvedLanguage;
      try {
        docEntry.doc.transact(() => {
          if (docEntry.text.length > 0) {
            docEntry.text.delete(0, docEntry.text.length);
          }
          if (newCode.length > 0) {
            docEntry.text.insert(0, newCode);
          }
        }, "legacy-code-update");
      } catch (error) {
        console.error(
          `[collab.socket] Failed to sync legacy code update for ${sessionId}`,
          error,
        );
      }
      const encoded = encodeUpdateToBase64(Y.encodeStateAsUpdate(docEntry.doc));
      socket.to(sessionId).emit("yjsUpdate", {
        sessionId,
        update: encoded,
        language: resolvedLanguage,
        userId: docEntry.lastAuthor,
      });
    }

    socket.to(sessionId).emit("codeUpdate", newCode);
    console.log("Forwarded legacy codeUpdate", {
      sessionId,
      userId: socket.data.userId,
      length: newCode.length,
    });
  });
};

export const heartbeatEvent = (socket) => {
  socket.on("heartbeat", () => {
    refreshSocketActivity(socket);
    console.log("Heartbeat", {
      socketId: socket.id,
      sessionId: socket.data.sessionId,
      userId: socket.data.userId,
    });
  });
};

export const yjsUpdateEvent = (socket) => {
  socket.on("yjsUpdate", (payload) => {
    const normalizedPayload =
      typeof payload === "object" && payload !== null ? payload : {};
    const sessionId =
      normalizedPayload.sessionId ?? socket.data.sessionId ?? null;
    const updatePayload = normalizedPayload.update;

    if (!sessionId || !updatePayload) {
      return;
    }

    const decoded = decodeUpdateFromBase64(updatePayload);
    if (!decoded) {
      return;
    }

    refreshSocketActivity(socket, { persist: false });

    const docEntry = ensureSessionDoc(sessionId);
    if (!docEntry) {
      return;
    }

    const resolvedLanguage =
      normaliseLanguage(normalizedPayload.language) ??
      docEntry.language ??
      socket.data.latestLanguage ??
      DEFAULT_LANGUAGE;
    const resolvedUserId =
      typeof normalizedPayload.userId === "string" &&
      normalizedPayload.userId.trim().length > 0
        ? normalizedPayload.userId.trim()
        : socket.data.userId;

    docEntry.lastAuthor = resolvedUserId;
    docEntry.language = resolvedLanguage;
    socket.data.latestLanguage = resolvedLanguage;

    try {
      Y.applyUpdate(docEntry.doc, decoded);
    } catch (error) {
      console.error(
        `[collab.socket] Failed to apply Yjs update for ${sessionId}`,
        error,
      );
      return;
    }

    const content = docEntry.text.toString();
    socket.data.latestCode = content;

    const encoded =
      typeof updatePayload === "string"
        ? updatePayload
        : encodeUpdateToBase64(decoded);

    socket.to(sessionId).emit("yjsUpdate", {
      sessionId,
      update: encoded,
      language: resolvedLanguage,
      userId: resolvedUserId,
    });
    console.log("Broadcast yjsUpdate", {
      sessionId,
      userId: resolvedUserId,
      size: decoded.byteLength,
    });
  });
};

export const cursorUpdateEvent = (socket) => {
  socket.on("cursorUpdate", (payload) => {
    const normalizedPayload =
      typeof payload === "object" && payload !== null ? payload : {};
    const sessionId =
      normalizedPayload.sessionId ?? socket.data.sessionId ?? null;
    if (!sessionId) {
      return;
    }
    const userId =
      socket.data.userId ??
      (typeof normalizedPayload.userId === "string"
        ? normalizedPayload.userId.trim()
        : null);
    if (!userId) {
      return;
    }

    socket.to(sessionId).emit("cursorUpdate", {
      sessionId,
      userId,
      position: normalizedPayload.position ?? null,
      selection: normalizedPayload.selection ?? null,
    });
    console.log("Forwarded cursorUpdate", {
      sessionId,
      userId,
      position: normalizedPayload.position ?? null,
    });
  });
};

export const awarenessUpdateEvent = (socket) => {
  socket.on("awarenessUpdate", (payload) => {
    const sessionId = payload?.sessionId ?? socket.data.sessionId;
    const updatePayload = payload?.update;

    if (!sessionId || !updatePayload) {
      return;
    }

    const decoded = decodeUpdateFromBase64(updatePayload);
    if (!decoded) {
      console.warn("[collab.socket] Invalid awareness update payload", payload);
      return;
    }

    // Just broadcast to other clients in the same session room
    socket.to(sessionId).emit("awarenessUpdate", {
      sessionId,
      update: encodeUpdateToBase64(decoded),
    });
  });
};

export const disconnectEvent = (socket, trackedSockets, io) => {
  socket.on("disconnect", async () => {
    console.log("A user disconnected:", socket.id);
    trackedSockets.delete(socket.id);
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (!sessionId) {
      return;
    }

    const timerKey = `${sessionId}:${userId ?? ""}`;
    const existingTimer = disconnectTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      disconnectTimers.delete(timerKey);
      try {
        const { session, ended, removedUser } =
          await SessionService.disconnectSession(sessionId, { userId });

        if (!session) {
          return;
        }

        if (ended) {
          const participantIds = getParticipantIds(session);
          io.to(sessionId).emit("sessionEnded", sessionId);
          console.log(
            `Session ${sessionId} ended because socket ${socket.id} disconnected`,
          );
          const uniqueParticipants =
            participantIds.length > 0 ? participantIds : [];
          const preferred = [userId, removedUser].filter(Boolean);
          const targets = Array.from(
            new Set(preferred.length > 0 ? preferred : uniqueParticipants),
          );
          const sessionEndedAt = session?.endedAt ?? new Date().toISOString();

          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[collab.socket] Missing code while persisting disconnect history",
              { sessionId },
            );
          } else {
            targets.forEach((participantId, index) => {
              console.log("[collab.socket] Persisting disconnect history", {
                sessionId,
                participantId,
                index,
                total: targets.length,
              });
              const participantsForPayload =
                participantIds.length > 0 ? participantIds : [participantId];
              void persistSessionHistory(session, {
                userId: participantId,
                participants: participantsForPayload,
                clearSnapshot: index === targets.length - 1,
                sessionEndedAt,
                sessionStartedAt: session?.createdAt,
                durationMs: session?.timeTaken,
                code,
                language,
              });
            });
            if (code) {
              clearSessionCodeCache(sessionId);
            }
          }
        } else if (removedUser) {
          const participantIdsForRemoved = getParticipantIds(session);
          io.to(sessionId).emit("participantLeft", {
            sessionId,
            userId: removedUser,
            reason: "disconnect",
          });
          console.log(
            `User ${removedUser} left session ${sessionId} via disconnect ${socket.id}`,
          );
          console.log(
            "[collab.socket] Persisting history for removed disconnected user",
            {
              sessionId,
              userId: removedUser,
            },
          );
          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[collab.socket] Missing code while persisting removed disconnect history",
              { sessionId, userId: removedUser },
            );
          } else {
            void persistSessionHistory(session, {
              userId: removedUser,
              participants:
                participantIdsForRemoved.length > 0
                  ? participantIdsForRemoved
                  : [removedUser],
              clearSnapshot: false,
              sessionStartedAt: session?.createdAt,
              durationMs: session?.timeTaken,
              code,
              language,
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to end session ${sessionId} after disconnect ${socket.id}:`,
          error,
        );
      }
    }, 120_000);

    disconnectTimers.set(timerKey, timer);
  });
};
