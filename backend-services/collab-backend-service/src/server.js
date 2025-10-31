import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/collab.socket.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5276;

const server = http.createServer(app);

async function start() {
  await connectDB()
    .then(() => {
      console.log("MongoDB Connected!");

      const io = initSocket(server);
      app.locals.io = io;

      server.listen(PORT);
      console.log("User service server listening on port:" + PORT);
    })
    .catch((err) => {
      console.error("Failed to connect to DB");
      console.error(err);
    });
}

start();
