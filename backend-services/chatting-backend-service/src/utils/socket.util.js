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
    const { userId } = socket.handshake?.auth || {};
    if (userId) socket.data.userId = userId;

    socket.on("join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.data.roomId = roomId;
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", (payload) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.broadcast.to(roomId).emit("receive_message", payload.message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  console.log("Socket.io initialized");
  return io;
};
