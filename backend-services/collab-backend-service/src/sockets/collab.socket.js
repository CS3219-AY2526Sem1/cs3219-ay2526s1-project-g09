import { initialiseRedisAdapter } from "../services/redis.service.js";
import { createServer } from "./socketServer.js";
import { createInactivitySweep, trackedSockets } from "./activityTracker.js";
import {
  connectSocketEvent,
  createSessionEvent,
  joinRoomEvent,
  heartbeatEvent,
  yjsUpdateEvent,
  cursorUpdateEvent,
  awarenessUpdateEvent,
  disconnectEvent,
} from "./socketEvents.js";

export const initSocket = (server) => {
  const io = createServer(server);
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

  const runInactivitySweep = createInactivitySweep(io);

  const inactivityInterval = setInterval(runInactivitySweep, 30 * 1000);

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

    yjsUpdateEvent(socket);

    cursorUpdateEvent(socket);

    awarenessUpdateEvent(socket);

    disconnectEvent(socket, trackedSockets, io);
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
