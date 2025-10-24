import { Server } from "socket.io";

const socketData = new Map();
const userSockets = new Map();
const userStatus = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socketData.set(socket.id, {
      userId: null,
      username: null,
      roomId: null,
    });
    console.log("New user connected to chat service at socket ", socket.id);

    socket.on("join_room", (payload) => {
      const { userId, username, roomId } = payload;

      if (!roomId || !userId || !username) return;

      socket.join(roomId);
      console.log(`User ${socket.id} joining chat room ${roomId}`);
      socket.data = { userId, username, roomId };

      socketData.set(socket.id, {
        userId,
        username,
        roomId,
      });

      userSockets.set(userId, socket.id);
      userStatus.set(userId, { lastDisconnect: null, online: true });

      socket.to(roomId).emit("system_message", {
        event: "connect",
        userId,
        username,
        text: `${username} has entered the chat.`,
      });

      console.log(`User ${socket.id} joined chat room ${roomId}`);
    });

    socket.on("reconnect_notice", ({ userId, username, roomId }) => {
      if (!roomId || !userId || !username) return;

      userSockets.set(userId, socket.id);
      userStatus.set(userId, { lastDisconnect: null, online: true });

      console.log(`${username} reconnected to room ${roomId}`);

      socket.to(roomId).emit("system_message", {
        event: "reconnect",
        userId,
        username,
        text: `${username} has reconnected.`,
      });
    });

    socket.on("send_message", (payload) => {
      console.log("Message received at socket ", socket.id, ": ", payload);
      const { roomId } = socket.data;
      console.log("Emitting message to room ", roomId);
      if (!roomId) return;
      socket.to(roomId).emit("receive_message", payload.message);
    });

    socket.on("disconnect", () => {
      const { userId, username, roomId } = socket.data;
      console.log("User disconnected:", socket.id);
      socketData.delete(socket.id);

      const lastKnown = userStatus.get(userId) || {};
      userStatus.set(userId, {
        ...lastKnown,
        online: false,
        lastDisconnect: Date.now(),
      });

      setTimeout(() => {
        const status = userStatus.get(userId);
        const currentSocket = userSockets.get(userId);
        if (status && !status.online && currentSocket === socket.id) {
          io.to(roomId).emit("system_message", {
            event: "disconnect",
            userId,
            username,
            text: `${username} has left the chat.`,
          });
          userSockets.delete(userId);
          console.log(`${username} confirmed as disconnected`);
        } else {
          console.log(
            `${username} reconnected in time — skipping disconnect message`,
          );
        }
      }, 1000);
    });
  });

  console.log("Socket.io initialized");
  return io;
};
