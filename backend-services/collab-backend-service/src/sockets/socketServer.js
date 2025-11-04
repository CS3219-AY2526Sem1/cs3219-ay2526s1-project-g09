import { Server } from "socket.io";

export const createServer = (server) =>
  new Server(server, {
    path: "/api/v1/collab-service/socket.io",
    cors: {
      origin: [
        "http://localhost:5173",
        "https://d1h013fkmpx3nu.cloudfront.net",
      ],
      methods: ["GET", "POST"],
    },
  });
