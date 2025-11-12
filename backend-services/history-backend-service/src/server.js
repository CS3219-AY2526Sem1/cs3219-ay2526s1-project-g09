import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5278;

const server = http.createServer(app);

async function start() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`History service listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start history service:", error);
    process.exitCode = 1;
  }
}

start();

export default server;
