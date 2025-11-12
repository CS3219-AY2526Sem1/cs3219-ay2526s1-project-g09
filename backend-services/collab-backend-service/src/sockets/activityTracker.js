// utilities for tracking socket activity
import { persistSessionHistory } from "../services/sessionHistory.service.js";
import SessionService from "../services/session.service.js";
import { getSessionSnapshot, clearSessionCodeCache } from "./yjsSync.js";
import { getParticipantIds } from "../utils/session.utils.js";

const trackedSockets = new Map();
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

const createInactivitySweep = (io) => {
  if (!io) {
    throw new Error("Socket server instance is required for inactivity sweep.");
  }

  return async () => {
    const now = Date.now();

    for (const [socketId, metadata] of trackedSockets.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        trackedSockets.delete(socketId);
        continue;
      }

      const sessionId = socket.data.sessionId ?? metadata.sessionId;
      const userId = socket.data.userId ?? metadata.userId;
      const lastActivity = socket.data.lastActivity ?? metadata.lastActivity;

      if (!sessionId || !userId) {
        continue;
      }

      if (socket.data.markedInactive) {
        continue;
      }

      if (lastActivity + INACTIVITY_TIMEOUT_MS > now) {
        continue;
      }

      try {
        const result = await SessionService.disconnectSession(sessionId, {
          userId,
        });

        if (!result.session) {
          socket.data.markedInactive = true;
          trackedSockets.set(socketId, {
            sessionId,
            userId,
            lastActivity: now,
          });
          continue;
        }

        socket.data.markedInactive = true;
        trackedSockets.set(socketId, {
          sessionId,
          userId,
          lastActivity: now,
        });

        if (result.ended) {
          const participantIds = getParticipantIds(result.session);
          io.to(sessionId).emit("sessionEnded", sessionId);
          console.log(
            `Session ${sessionId} ended due to inactivity for user ${userId}`,
          );
          const uniqueParticipants =
            participantIds.length > 0 ? participantIds : [];
          const preferred = [userId, result.removedUser].filter(Boolean);
          const targets = Array.from(
            new Set(preferred.length > 0 ? preferred : uniqueParticipants),
          );
          const sessionEndedAt =
            result.session?.endedAt ?? new Date().toISOString();

          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[sessionLifecycle] Missing code while persisting inactivity history",
              { sessionId, userId },
            );
          } else {
            targets.forEach((participantId, index) => {
              console.log("Persisting inactivity history", {
                sessionId,
                participantId,
                index,
                total: targets.length,
              });
              const participantsForPayload =
                participantIds.length > 0 ? participantIds : [participantId];
              void persistSessionHistory(result.session, {
                userId: participantId,
                participants: participantsForPayload,
                clearSnapshot: index === targets.length - 1,
                sessionEndedAt,
                sessionStartedAt: result.session?.createdAt,
                durationMs: result.session?.timeTaken,
                code,
                language,
              });
            });
            if (code) {
              clearSessionCodeCache(sessionId);
            }
          }
        } else if (result.removedUser) {
          const participantIdsForRemoved = getParticipantIds(result.session);
          io.to(sessionId).emit("participantLeft", {
            sessionId,
            userId: result.removedUser,
            reason: "inactivity",
          });
          socket.emit("inactiveTimeout", {
            sessionId,
          });
          console.log(
            `Marked ${result.removedUser} inactive in session ${sessionId} (socket ${socket.id})`,
          );
          console.log("Persisting history for removed inactive user", {
            sessionId,
            userId: result.removedUser,
          });
          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[sessionLifecycle] Missing code while persisting inactive removal history",
              { sessionId, userId: result.removedUser },
            );
          } else {
            void persistSessionHistory(result.session, {
              userId: result.removedUser,
              participants:
                participantIdsForRemoved.length > 0
                  ? participantIdsForRemoved
                  : [result.removedUser],
              clearSnapshot: false,
              sessionStartedAt: result.session?.createdAt,
              durationMs: result.session?.timeTaken,
              code,
              language,
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to mark ${userId} inactive in session ${sessionId}:`,
          error,
        );
      }
    }
  };
};

const refreshSocketActivity = (socket, options = {}) => {
  // Update when we see a heartbeat or Yjs payload
  const { persist = true } = options;
  const { sessionId, userId } = socket.data ?? {};
  const lastActivity = Date.now();

  socket.data.lastActivity = lastActivity;
  socket.data.markedInactive = false;
  trackedSockets.set(socket.id, {
    sessionId,
    userId,
    lastActivity,
  });

  if (persist && sessionId && userId) {
    SessionService.markActive(sessionId, userId).catch((error) => {
      console.error(
        `Failed to refresh activity for ${userId} in session ${sessionId}:`,
        error,
      );
    });
  }
};

export {
  INACTIVITY_TIMEOUT_MS,
  refreshSocketActivity,
  trackedSockets,
  createInactivitySweep,
};
