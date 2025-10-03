import { Server } from "socket.io";
import SessionService from "../services/session.service.js";

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
      socket.data.sessionId = sessionId;
      console.log(`User ${socket.id} joined room ${sessionId}`);
    });

    socket.on("codeUpdate", ({ sessionId, newCode }) => {
      socket.to(sessionId).emit("codeUpdate", newCode);
    });

    socket.on("disconnect", async () => {
      console.log("A user disconnected:", socket.id);
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      try {
        const existingSession = await SessionService.getSession(sessionId);
        if (!existingSession || existingSession.active === false) {
          return;
        }

        const endedSession = await SessionService.endSession(sessionId);
        if (endedSession) {
          io.to(sessionId).emit("sessionEnded", sessionId);
          console.log(
            `Session ${sessionId} ended because socket ${socket.id} disconnected`,
          );
        }
      } catch (error) {
        console.error(
          `Failed to end session ${sessionId} after disconnect ${socket.id}:`,
          error,
        );
      }
    });
  });

  return io;
};
