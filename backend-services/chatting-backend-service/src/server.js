import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.util.js";

const PORT = process.env.PORT || 5286;

const server = http.createServer(app);

async function start() {
  initSocket(server);
  server.listen(PORT);
  console.log("User service server listening on http://localhost:" + PORT);
}

start();
