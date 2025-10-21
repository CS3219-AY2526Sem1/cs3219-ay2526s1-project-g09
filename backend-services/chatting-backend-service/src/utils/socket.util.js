import { Server } from "socket.io";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);
    const auth = socket.handshake?.auth || {};
    const userId = auth.userId;
    const username = auth.username;

    if (userId) socket.data.userId = userId;
    if (username) socket.data.username = username;

    socket.on("join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.data.roomId = roomId;
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", (payload) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit("receive_message", payload.message);
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit("user_left", {
          text: `${socket.data.username || socket.id} has left the chat.`,
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });

  console.log("Socket.io initialized");
  return io;
};
