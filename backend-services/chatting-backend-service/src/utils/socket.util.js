import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import RedisService from "../services/redis.service.js";

const DISCONNECT_TIMEOUT_MS = 10_000;

// Purpose: to hold pending disconnect timers
const disconnectTimers = new Map();

export const initSocket = async (server) => {
  const redis = await RedisService.getInstance();

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

  io.adapter(createAdapter(redis.pubClient, redis.subClient));

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
      const latest = await redis.getUser(roomId, userId);
      if (!latest || latest.isDisconnectConfirm) return;

      io.to(roomId).emit("system_message", {
        event: "disconnect",
        userId,
        username,
        text: `${username} has left the chat.`,
      });

      await redis.addOrUpdateUser(roomId, userId, {
        ...latest,
        isDisconnectConfirm: true,
      });

      console.log(`${username} confirmed disconnected.`);

      // Clean up if everyone disconnected
      const users = await redis.getAllUsers(roomId);
      const hasUsers = Object.keys(users).length > 0;
      const allDisconnected =
        hasUsers && Object.values(users).every((u) => u.isDisconnectConfirm);

      if (allDisconnected) {
        await redis.deleteRoom(roomId);
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

      const currentUser = await redis.getUser(roomId, userId);
      const allUsers = await redis.getAllUsers(roomId);

      // clear pending disconnect timers
      const timerKey = `${roomId}:${userId}`;
      if (disconnectTimers.has(timerKey)) {
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);
        console.log(`Cleared pending disconnect timer for ${username}`);
      }

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
        await redis.addOrUpdateUser(roomId, userId, {
          username,
          isDisconnectConfirm: false,
        });
      } else {
        // New user joins
        await redis.addOrUpdateUser(roomId, userId, {
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

  console.log("Socket.io initialized (no socketData)");
  return io;
};
