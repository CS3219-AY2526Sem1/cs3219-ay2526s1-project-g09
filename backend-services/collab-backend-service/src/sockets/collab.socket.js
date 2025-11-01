import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import * as Y from "yjs";
import SessionService from "../services/session.service.js";
import { persistSessionHistory } from "../services/sessionHistory.service.js";

const DEFAULT_LANGUAGE = "javascript";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const HEARTBEAT_EVENT = "heartbeat";

const trackedSockets = new Map();
const disconnectTimers = new Map();
const sessionCodeCache = new Map();
const sessionDocs = new Map();

const encodeUpdateToBase64 = (update) =>
  Buffer.from(update ?? new Uint8Array()).toString("base64");

const decodeUpdateFromBase64 = (input) => {
  if (!input) {
    return null;
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  if (Array.isArray(input)) {
    try {
      return Uint8Array.from(input);
    } catch (error) {
      console.warn("[collab.socket] Failed to convert update array", error);
      return null;
    }
  }
  if (typeof input === "string") {
    try {
      return new Uint8Array(Buffer.from(input, "base64"));
    } catch (error) {
      console.warn("[collab.socket] Failed to decode update string", error);
      return null;
    }
  }
  console.warn("[collab.socket] Unsupported update payload type", {
    type: typeof input,
  });
  return null;
};

const ensureSessionDoc = (sessionId) => {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return null;
  }

  let entry = sessionDocs.get(sessionId);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry;
  }

  const doc = new Y.Doc();
  doc.gc = true;
  const text = doc.getText("source");

  const newEntry = {
    doc,
    text,
    lastAuthor: undefined,
    language: DEFAULT_LANGUAGE,
    lastAccessed: Date.now(),
  };

  doc.on("update", () => {
    const content = text.toString();
    updateSessionCodeCache(
      sessionId,
      newEntry.lastAuthor,
      content,
      newEntry.language,
    );
  });

  const cached = getSessionCodeCache(sessionId);
  if (cached?.code) {
    newEntry.language = cached.language ?? DEFAULT_LANGUAGE;
    doc.transact(() => {
      text.insert(0, cached.code);
    }, "bootstrap-cache");
  }

  sessionDocs.set(sessionId, newEntry);
  return newEntry;
};

const destroySessionDoc = (sessionId) => {
  const entry = sessionDocs.get(sessionId);
  if (!entry) {
    return;
  }
  try {
    entry.doc.destroy();
  } catch (error) {
    console.warn(
      `[collab.socket] Failed to destroy Yjs doc for ${sessionId}`,
      error,
    );
  }
  sessionDocs.delete(sessionId);
};

const getSessionSnapshot = (sessionId, socket) => {
  const docEntry = sessionDocs.get(sessionId);
  if (docEntry?.text) {
    return {
      code: docEntry.text.toString(),
      language: docEntry.language ?? DEFAULT_LANGUAGE,
    };
  }
  const cached = getSessionCodeCache(sessionId);
  const latestLanguage =
    socket?.data?.latestLanguage ?? cached?.language ?? DEFAULT_LANGUAGE;
  const code = socket?.data?.latestCode ?? cached?.code ?? null;
  return {
    code,
    language: latestLanguage,
  };
};

const initialiseRedisAdapter = async () => {
  const redisUrl =
    process.env.COLLAB_REDIS_URL ?? process.env.REDIS_URL ?? null;
  const redisHost =
    process.env.COLLAB_REDIS_HOST ?? process.env.REDIS_HOST ?? null;

  if (!redisUrl && !redisHost) {
    console.log(
      "[collab.socket][redis] Adapter disabled: no COLLAB_REDIS_URL or COLLAB_REDIS_HOST configured.",
    );
    return null;
  }

  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error("[collab.socket][redis] Publisher error:", error);
  });
  subClient.on("error", (error) => {
    console.error("[collab.socket][redis] Subscriber error:", error);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);

  console.log("[collab.socket] Redis adapter connected.");

  return {
    adapter: createAdapter(pubClient, subClient),
    clients: [pubClient, subClient],
  };
};

const normaliseLanguage = (language) => {
  if (typeof language !== "string") {
    return null;
  }
  const trimmed = language.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

const updateSessionCodeCache = (sessionId, userId, code, language) => {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return;
  }
  if (typeof code !== "string") {
    return;
  }

  const entry = {
    code,
    language: normaliseLanguage(language) ?? DEFAULT_LANGUAGE,
    userId: typeof userId === "string" ? userId : undefined,
    updatedAt: Date.now(),
  };

  sessionCodeCache.set(sessionId, entry);
};

const getSessionCodeCache = (sessionId) => {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return null;
  }
  return sessionCodeCache.get(sessionId);
};

const clearSessionCodeCache = (sessionId) => {
  if (!sessionId) {
    return;
  }
  sessionCodeCache.delete(sessionId);
  destroySessionDoc(sessionId);
};

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
    path: "/api/v1/collab-service/socket.io",
    cors: {
      origin: [
        "http://localhost:5173",
        "https://d1h013fkmpx3nu.cloudfront.net",
      ],
      methods: ["GET", "POST"],
    },
  });
  const redisClients = [];

  (async () => {
    try {
      const redisResources = await initialiseRedisAdapter();
      if (redisResources?.adapter) {
        io.adapter(redisResources.adapter);
        redisClients.push(...(redisResources.clients ?? []));
        console.log("[collab.socket] Redis adapter registered with Socket.IO.");
      }
    } catch (error) {
      console.error(
        "[collab.socket][redis] Failed to initialise adapter. Falling back to default adapter.",
        error,
      );
    }
  })().catch((error) => {
    console.error(
      "[collab.socket][redis] Unexpected error during adapter bootstrap:",
      error,
    );
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

          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[collab.socket] Missing code while persisting inactivity history",
              { sessionId, userId },
            );
          } else {
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
          console.log(
            "[collab.socket] Persisting history for removed inactive user",
            {
              sessionId,
              userId: result.removedUser,
            },
          );
          const snapshot = getSessionSnapshot(sessionId, socket);
          const code = snapshot.code;
          const language = snapshot.language;

          if (!code) {
            console.warn(
              "[collab.socket] Missing code while persisting inactive removal history",
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
    });

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
        const encoded = encodeUpdateToBase64(
          Y.encodeStateAsUpdate(docEntry.doc),
        );
        socket.to(sessionId).emit("yjsUpdate", {
          sessionId,
          update: encoded,
          language: resolvedLanguage,
          userId: docEntry.lastAuthor,
        });
      }

      socket.to(sessionId).emit("codeUpdate", newCode);
    });

    socket.on(HEARTBEAT_EVENT, () => {
      refreshSocketActivity(socket);
    });

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
  });

  io.engine.on("close", () => {
    clearInterval(inactivityInterval);
    redisClients.forEach((client) => {
      client.quit?.().catch((error) => {
        console.warn(
          "[collab.socket][redis] Failed to close Redis client cleanly:",
          error,
        );
      });
    });
  });

  return io;
};
