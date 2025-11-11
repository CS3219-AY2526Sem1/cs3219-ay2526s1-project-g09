import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import RedisService from "../services/redis.service.js";

const DISCONNECT_TIMEOUT_MS = 10_000;

class InMemoryRoomStore {
  constructor() {
    this.rooms = new Map();
  }

  async addOrUpdateUser(roomId, userId, data) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Map());
    this.rooms.get(roomId).set(userId, data);
  }

  async getUser(roomId, userId) {
    return this.rooms.get(roomId)?.get(userId) ?? null;
  }

  async getAllUsers(roomId) {
    const users = this.rooms.get(roomId);
    if (!users) return {};
    return Object.fromEntries(users.entries());
  }

  async removeUser(roomId, userId) {
    this.rooms.get(roomId)?.delete(userId);
  }

  async deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }
}

// Purpose: to hold pending disconnect timers
const disconnectTimers = new Map();

export const initSocket = async (server) => {
  let roomStore;

  const io = new Server(server, {
    path: "/api/v1/chat-service/socket.io",
    cors: {
      origin: [
        "http://localhost:5173",
        "https://d1h013fkmpx3nu.cloudfront.net",
      ],
      methods: ["GET", "POST"],
    },
  });

  // Initialize Redis adapter with error handling
  try {
    const redis = await RedisService.getInstance();
    io.adapter(createAdapter(redis.pubClient, redis.subClient));
    console.log("Redis adapter successfully initialized for chat service");
    roomStore = redis;
  } catch (error) {
    console.error(
      "[chat.socket][redis] Failed to initialize Redis adapter. Falling back to in-memory adapter:",
      error,
    );
    // Socket.IO will use default in-memory adapter if no adapter is set
    // Redis will remain undefined, which is handled below
    roomStore = new InMemoryRoomStore();
  }

  async function handleDisconnect(socket, immediate) {
    const { userId, username, roomId } = socket.data;
    if (!roomId || !userId) return;

    const timerKey = `${roomId}:${userId}`;

    // cancel any existing timer with same key (in case)
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }

    console.log(`User disconnected: ${username} (${socket.id})`);

    async function performDisconnect() {
      const latest = await roomStore.getUser(roomId, userId);
      if (!latest || latest.isDisconnectConfirm) return;

      io.to(roomId).emit("system_message", {
        event: "disconnect",
        userId,
        username,
        text: `${username} has left the chat.`,
      });

      await roomStore.addOrUpdateUser(roomId, userId, {
        ...latest,
        isDisconnectConfirm: true,
      });

      console.log(`${username} confirmed disconnected.`);

      // Clean up if everyone disconnected
      const users = await roomStore.getAllUsers(roomId);
      const hasUsers = Object.keys(users).length > 0;
      const allDisconnected =
        hasUsers && Object.values(users).every((u) => u.isDisconnectConfirm);

      if (allDisconnected) {
        await roomStore.deleteRoom(roomId);
        console.log(`Room ${roomId} cleaned up.`);
      }

      disconnectTimers.delete(timerKey);
    }
    if (immediate) {
      await performDisconnect();
    } else {
      // Establish a pending disconnect timer for this event,
      // once 10 secs have passed without reconnection, emit disconnect message
      const timer = setTimeout(async () => {
        try {
          await performDisconnect();
        } catch (err) {
          console.error(
            `Error performing delayed disconnect for ${username}:`,
            err,
          );
        } finally {
          disconnectTimers.delete(timerKey);
        }
      }, DISCONNECT_TIMEOUT_MS);
      disconnectTimers.set(timerKey, timer);
    }
  }

  io.on("connection", async (socket) => {
    console.log("New user connected to chat service at socket", socket.id);

    socket.on("join_room", async ({ userId, username, roomId }) => {
      if (!roomId || !userId || !username) return;

      socket.join(roomId);
      socket.data = { userId, username, roomId };

      // clear pending disconnect timers
      const timerKey = `${roomId}:${userId}`;
      if (disconnectTimers.has(timerKey)) {
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);
        console.log(`Cleared pending disconnect timer for ${username}`);
      }

      const currentUser = await roomStore.getUser(roomId, userId);
      const allUsers = await roomStore.getAllUsers(roomId);

      if (currentUser) {
        if (currentUser.isDisconnectConfirm) {
          io.to(roomId).emit("system_message", {
            event: "reconnect",
            userId,
            username,
            text: `${username} has reconnected.`,
          });
          console.log(
            `${username} reconnected (after confirmed disconnect) in ${roomId}`,
          );
        } else {
          console.log(
            `${username} reconnected before disconnect confirmation — no message emitted`,
          );
        }

        // Reset flag on any reconnect
        await roomStore.addOrUpdateUser(roomId, userId, {
          username,
          isDisconnectConfirm: false,
        });
      } else {
        // New user joins
        await roomStore.addOrUpdateUser(roomId, userId, {
          username,
          isDisconnectConfirm: false,
        });

        io.to(roomId).emit("system_message", {
          event: "connect",
          userId,
          username,
          text: `${username} has entered the chat.`,
        });

        // Notify about other users in the room
        const others = Object.entries(allUsers).filter(([id]) => id !== userId);
        if (others.length > 0) {
          others.forEach(([otherId, other]) => {
            if (!other.isDisconnectConfirm) {
              socket.emit("system_message", {
                event: "existing_users",
                userId: otherId,
                username: other.username,
                text: `${other.username} is already in the chat.`,
              });
            }
          });
        }

        console.log(`${username} joined room ${roomId}`);
      }
    });

    socket.on("send_message", (payload) => {
      const { roomId } = socket.data;
      if (!roomId) return;
      socket.to(roomId).emit("receive_message", payload.message);
    });

    socket.on("leave_session", () => {
      socket.data.manualLeave = true;
      socket.disconnect(true);
    });

    socket.on("disconnect", async () => {
      const isManual = socket.data?.manualLeave || false;
      console.log(
        `Socket ${socket.id} disconnected (${isManual ? "manual" : "auto"})`,
      );
      await handleDisconnect(socket, isManual); // true = immediate, false = delayed
    });
  });

  let shutdownPromise = null;
  const close = async () => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      console.log("[chat.socket] Closing Socket.IO server...");

      // Clear all pending disconnect timers
      for (const timer of disconnectTimers.values()) {
        clearTimeout(timer);
      }
      disconnectTimers.clear();
      console.log("[chat.socket] Cleared all pending disconnect timers");

      // Disconnect all connected sockets
      io.sockets.sockets.forEach((socket) => socket.disconnect(true));
      console.log("[chat.socket] Disconnected all sockets");

      // Close Socket.IO server
      await new Promise((resolve) => {
        io.close(() => {
          console.log("[chat.socket] Socket.IO server closed");
          resolve();
        });
      });

      // Close Redis clients if using Redis adapter
      if (roomStore?.close) {
        await roomStore.close();
      }
    })();

    return shutdownPromise;
  };

  console.log("Socket.io initialized (no socketData)");
  return { io, close };
};
