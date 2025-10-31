import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { initRedis, RedisRooms } from "../services/redis.service.js";

const DISCONNECT_TIMEOUT_MS = 10_000;

// Purpose: to hold pending disconnect timers
const disconnectTimers = new Map();

export const initSocket = async (server) => {
  const { pubClient, subClient } = await initRedis();

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

  io.adapter(createAdapter(pubClient, subClient));

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
      const latest = await RedisRooms.getUser(roomId, userId);
      if (!latest || latest.isDisconnectConfirm) return;

      io.to(roomId).emit("system_message", {
        event: "disconnect",
        userId,
        username,
        text: `${username} has left the chat.`,
      });

      await RedisRooms.addOrUpdateUser(roomId, userId, {
        ...latest,
        isDisconnectConfirm: true,
      });

      console.log(`${username} confirmed disconnected.`);

      // Clean up if everyone disconnected
      const users = await RedisRooms.getAllUsers(roomId);
      const allDisconnected = Object.values(users).every(
        (u) => u.isDisconnectConfirm,
      );

      if (allDisconnected) {
        await RedisRooms.deleteRoom(roomId);
        console.log(`Room ${roomId} cleaned up.`);
      }

      disconnectTimers.delete(timerKey);
    }
    if (immediate) {
      await performDisconnect();
    } else {
      // Establish a pending disconnect timer for this event,
      // once 10 secs have passed without reconnection, emit disconnect message
      const timer = setTimeout(performDisconnect, DISCONNECT_TIMEOUT_MS);
      disconnectTimers.set(timerKey, timer);
    }
  }

  io.on("connection", async (socket) => {
    console.log("New user connected to chat service at socket", socket.id);

    socket.on("join_room", async ({ userId, username, roomId }) => {
      if (!roomId || !userId || !username) return;

      socket.join(roomId);
      socket.data = { userId, username, roomId };

      const currentUser = await RedisRooms.getUser(roomId, userId);
      const allUsers = await RedisRooms.getAllUsers(roomId);

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
        await RedisRooms.addOrUpdateUser(roomId, userId, {
          username,
          isDisconnectConfirm: false,
        });
      } else {
        // New user joins
        await RedisRooms.addOrUpdateUser(roomId, userId, {
          username,
          isDisconnectConfirm: false,
        });

        io.to(roomId).emit("system_message", {
          event: "connect",
          userId,
          username,
          text: `${username} has entered the chat.`,
        });

        console.log(`${username} joined room ${roomId}`);
      }

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
