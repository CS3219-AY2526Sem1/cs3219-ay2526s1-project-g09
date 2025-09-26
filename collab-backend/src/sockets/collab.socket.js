import { Server } from "socket.io";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    socket.on("sessionCreated", (s) => {
      console.log("got sessionCreated:", s);
    });

    // sessionId passed from frontend
    socket.on("joinRoom", (sessionId) => {
      socket.join(sessionId);
      console.log(`User ${socket.id} joined room ${sessionId}`);
    });

    socket.on("codeUpdate", ({ sessionId, newCode }) => {
      socket.to(sessionId).emit("codeUpdate", newCode);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
};
