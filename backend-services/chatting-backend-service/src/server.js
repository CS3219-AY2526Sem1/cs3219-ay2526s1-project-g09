import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.util.js";

const PORT = process.env.PORT || 5286;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30_000;
const parsedShutdownTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS);
const SHUTDOWN_TIMEOUT_MS = Number.isFinite(parsedShutdownTimeout)
  ? parsedShutdownTimeout
  : DEFAULT_SHUTDOWN_TIMEOUT_MS;

const server = http.createServer(app);
let socketLifecycle;
let isShuttingDown = false;

async function start() {
  socketLifecycle = await initSocket(server);
  server.listen(PORT);
  console.log("User service server listening on port:" + PORT);
}

const waitForServerClose = () =>
  new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close((error) => {
      if (error) {
        console.error("[chat-service] Error while closing HTTP server:", error);
      } else {
        console.log("[chat-service] HTTP server closed");
      }
      resolve();
    });
  });

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(
    `[chat-service] Received ${signal}. Starting graceful shutdown...`,
  );

  // Force exit timeout
  const forceExitTimer = setTimeout(() => {
    console.error(
      "[chat-service] Graceful shutdown timed out. Forcing exit.",
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // Close Socket.IO and HTTP server in parallel
    await Promise.all([socketLifecycle?.close?.(), waitForServerClose()]);

    clearTimeout(forceExitTimer);
    console.log("[chat-service] Shutdown complete. Exiting.");
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error("[chat-service] Failed to shutdown cleanly:", error);
    process.exit(1);
  }
};

// Register signal handlers
const signals = ["SIGTERM", "SIGINT"];
signals.forEach((signal) => {
  process.on(signal, () => {
    void gracefulShutdown(signal);
  });
});

start();
