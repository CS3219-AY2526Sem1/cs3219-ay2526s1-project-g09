import { Server } from "socket.io";

const userSockets = new Map();
const roomUsers = new Map();
const disconnectTimers = new Map();

const DISCONNECT_TIMEOUT_MS = 3_000;

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New user connected to chat service at socket", socket.id);

    socket.on("join_room", ({ userId, username, roomId }) => {
      if (!roomId || !userId || !username) return;

      socket.join(roomId);
      socket.data = { userId, username, roomId };
      userSockets.set(userId, socket.id);

      // Ensure room exists
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, { users: {} });
      }

      const roomInfo = roomUsers.get(roomId);

      const existingUser = roomInfo.users[userId];
      const shouldAnnounceReconnect =
        existingUser?.disconnectAnnounced === true;

      const timerKey = `${roomId}:${userId}`;
      const existingTimer = disconnectTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        disconnectTimers.delete(timerKey);
      }

      if (shouldAnnounceReconnect) {
        socket.to(roomId).emit("system_message", {
          event: "reconnect",
          userId,
          username,
          text: `${username} has reconnected.`,
        });
        console.log(`${username} reconnected in room ${roomId}`);
      } else if (!existingUser) {
        const otherUserEntry = Object.entries(roomInfo.users).find(
          ([id]) => id !== userId,
        );

        if (otherUserEntry) {
          const [
            otherUserId,
            { username: otherUsername, online: otherOnline },
          ] = otherUserEntry;

          if (otherOnline) {
            socket.emit("system_message", {
              event: "existing_users",
              userId: otherUserId,
              username: otherUsername,
              text: `${otherUsername} is already in the chat.`,
            });
          }
        }

        io.to(roomId).emit("system_message", {
          event: "connect",
          userId,
          username,
          text: `${username} has entered the chat.`,
        });
        console.log(`${username} joined room ${roomId}`);
      } else {
        console.log(`${username} created room ${roomId}`);
      }
      roomInfo.users[userId] = {
        username,
        online: true,
        disconnectAnnounced: false,
      };
    });

    socket.on("send_message", (payload) => {
      const { roomId } = socket.data;
      if (!roomId) return;
      socket.to(roomId).emit("receive_message", payload.message);
    });

    socket.on("disconnect", () => {
      const { userId, username, roomId } = socket.data;
      if (!roomId || !userId) return;
      console.log(`User disconnected: ${username} (${socket.id})`);

      const roomInfo = roomUsers.get(roomId);
      if (!roomInfo || !roomInfo.users[userId]) return;

      roomInfo.users[userId].online = false;

      const timerKey = `${roomId}:${userId}`;
      const timer = setTimeout(() => {
        const userRecord = roomInfo.users[userId];
        if (userRecord && !userRecord.online) {
          io.to(roomId).emit("system_message", {
            event: "disconnect",
            userId,
            username,
            text: `${username} has left the chat.`,
          });
          userRecord.disconnectAnnounced = true;
          console.log(`${username} confirmed as disconnected.`);

          const allOffline = Object.values(roomInfo.users).every(
            (u) => !u.online,
          );
          if (allOffline) {
            roomUsers.delete(roomId);
            console.log(`Room ${roomId} cleaned up (all users offline).`);
          }
        } else {
          console.log(`${username} reconnected in time — skipping disconnect.`);
        }
        disconnectTimers.delete(timerKey);
      }, DISCONNECT_TIMEOUT_MS);

      disconnectTimers.set(timerKey, timer);
    });
  });

  console.log("Socket.io initialized (no socketData)");
  return io;
};
