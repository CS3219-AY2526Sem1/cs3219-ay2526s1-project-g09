import { Server } from "socket.io";
import SessionService from "../services/session.service.js";
import CodeSnapshotService from "../services/codeSnapshot.service.js";
import { persistSessionHistory } from "../services/sessionHistory.service.js";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const HEARTBEAT_EVENT = "heartbeat";

const trackedSockets = new Map();
const disconnectTimers = new Map();

const getParticipantIds = (session) => {
  const ids = [];

  if (Array.isArray(session?.users)) {
    ids.push(
      ...session.users.filter(
        (id) => typeof id === "string" && id.trim().length > 0,
      ),
    );
  }

  if (Array.isArray(session?.participants)) {
    ids.push(
      ...session.participants
        .map((participant) => participant?.userId)
        .filter((id) => typeof id === "string" && id.trim().length > 0),
    );
  }

  return Array.from(new Set(ids));
};

const refreshSocketActivity = (socket, options = {}) => {
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

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://peerprep-ui-shell.s3-website-ap-southeast-1.amazonaws.com",
      ],
      methods: ["GET", "POST"],
    },
  });

  const runInactivitySweep = async () => {
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

          targets.forEach((participantId, index) => {
            console.log("[collab.socket] Persisting inactivity history", {
              sessionId,
              participantId,
              index,
              total: targets.length,
            });
            const participantsForPayload =
              participantIds.length > 0 ? participantIds : [participantId];
            void persistSessionHistory(result.session, {
              savedBy: participantId,
              userId: participantId,
              participants: participantsForPayload,
              clearSnapshot: index === targets.length - 1,
              sessionEndedAt,
            });
          });
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
          console.log(
            "[collab.socket] Persisting history for removed inactive user",
            {
              sessionId,
              userId: result.removedUser,
            },
          );
          void persistSessionHistory(result.session, {
            savedBy: result.removedUser,
            userId: result.removedUser,
            participants:
              participantIdsForRemoved.length > 0
                ? participantIdsForRemoved
                : [result.removedUser],
            clearSnapshot: false,
          });
        }
      } catch (error) {
        console.error(
          `Failed to mark ${userId} inactive in session ${sessionId}:`,
          error,
        );
      }
    }
  };

  const inactivityInterval = setInterval(runInactivitySweep, 30 * 1000);

  io.on("connection", (socket) => {
    const initialActivity = Date.now();
    socket.data.lastActivity = initialActivity;
    trackedSockets.set(socket.id, {
      sessionId: null,
      userId: null,
      lastActivity: initialActivity,
    });

    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    socket.on("sessionCreated", (s) => {
      console.log("got sessionCreated:", s);
    });

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
    });

    socket.on("codeUpdate", ({ sessionId, newCode, language }) => {
      refreshSocketActivity(socket, { persist: false });
      CodeSnapshotService.update(sessionId, {
        code: newCode,
        language,
        userId: socket.data.userId,
      });
      socket.to(sessionId).emit("codeUpdate", newCode);
    });

    socket.on(HEARTBEAT_EVENT, () => {
      refreshSocketActivity(socket);
    });

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
                savedBy: participantId,
                userId: participantId,
                participants: participantsForPayload,
                clearSnapshot: index === targets.length - 1,
                sessionEndedAt,
              });
            });
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
            void persistSessionHistory(session, {
              savedBy: removedUser,
              userId: removedUser,
              participants:
                participantIdsForRemoved.length > 0
                  ? participantIdsForRemoved
                  : [removedUser],
              clearSnapshot: false,
            });
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
  });

  io.engine.on("close", () => {
    clearInterval(inactivityInterval);
  });

  return io;
};
