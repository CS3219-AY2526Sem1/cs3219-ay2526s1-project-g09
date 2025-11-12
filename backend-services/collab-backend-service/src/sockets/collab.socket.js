import { initialiseRedisAdapter } from "../services/redis.service.js";
import { initialiseYjsRedisSync } from "../services/yjsRedis.service.js";
import { createIoServer } from "./socketServer.js";
import { createInactivitySweep, trackedSockets } from "./activityTracker.js";
import {
  connectSocketEvent,
  createSessionEvent,
  joinRoomEvent,
  heartbeatEvent,
  yjsUpdateEvent,
  cursorUpdateEvent,
  awarenessUpdateEvent,
  requestYjsInitEvent,
  disconnectEvent,
} from "./socketEvents.js";

export const initSocket = (server) => {
  const io = createIoServer(server);
  // Redis clients are stored for graceful shutdown; the array stays empty when
  // the adapter falls back to the in-memory default.
  const redisClients = [];
  const pendingYjsUpdates = [];
  let publishYjsUpdate = async (payload) => {
    pendingYjsUpdates.push(payload);
  };

  const stopInactivityWatcher = (() => {
    let inactivityInterval = null;
    return {
      start(runSweep) {
        if (inactivityInterval !== null) {
          clearInterval(inactivityInterval);
        }
        inactivityInterval = setInterval(runSweep, 30 * 1000);
      },
      stop() {
        if (inactivityInterval !== null) {
          clearInterval(inactivityInterval);
          inactivityInterval = null;
        }
      },
    };
  })();

  const closeRedisClients = async () => {
    await Promise.all(
      redisClients.map((client) =>
        client?.quit?.().catch((error) => {
          console.warn(
            "[collab.socket][redis] Failed to close Redis client cleanly:",
            error,
          );
        }),
      ),
    );
  };

  (async () => {
    try {
      const redisResources = await initialiseRedisAdapter();
      if (redisResources?.adapter) {
        io.adapter(redisResources.adapter);
        redisClients.push(...(redisResources.clients ?? []));
        console.log("[collab.socket] Redis adapter registered with Socket.IO.");
      }

      const yjsRedisResources = await initialiseYjsRedisSync();
      if (yjsRedisResources) {
        publishYjsUpdate = (payload) =>
          yjsRedisResources.publishUpdate(payload);
        redisClients.push(...(yjsRedisResources.clients ?? []));
        pendingYjsUpdates.splice(0).forEach((payload) => {
          yjsRedisResources.publishUpdate(payload).catch((error) => {
            console.error(
              "[collab.socket][yjs-sync] Failed to publish queued update:",
              error,
            );
          });
        });
      } else {
        publishYjsUpdate = async () => {};
        pendingYjsUpdates.length = 0;
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

  const runInactivitySweep = createInactivitySweep(io);
  // Periodically check for sockets that have gone silent and nudge SessionService
  // to evict them. This decouples inactivity handling from per-event logic.
  stopInactivityWatcher.start(runInactivitySweep);

  io.on("connection", (socket) => {
    const initialActivity = Date.now();
    socket.data.lastActivity = initialActivity;
    trackedSockets.set(socket.id, {
      sessionId: null,
      userId: null,
      lastActivity: initialActivity,
    });

    connectSocketEvent(socket);

    createSessionEvent(socket);

    joinRoomEvent(socket);

    heartbeatEvent(socket);

    yjsUpdateEvent(socket, publishYjsUpdate);

    cursorUpdateEvent(socket);

    awarenessUpdateEvent(socket);
    requestYjsInitEvent(socket);

    disconnectEvent(socket, trackedSockets, io);
  });

  io.engine.on("close", () => {
    stopInactivityWatcher.stop();
    void closeRedisClients();
  });

  let shutdownPromise = null;
  const close = async () => {
    if (shutdownPromise) {
      return shutdownPromise;
    }
    shutdownPromise = (async () => {
      stopInactivityWatcher.stop();
      await new Promise((resolve) => {
        io.close(() => resolve());
      });
      await closeRedisClients();
    })();
    return shutdownPromise;
  };

  return { io, close };
};
