import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/collab.socket.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5276;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30_000;
const parsedShutdownTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS);
const SHUTDOWN_TIMEOUT_MS = Number.isFinite(parsedShutdownTimeout)
  ? parsedShutdownTimeout
  : DEFAULT_SHUTDOWN_TIMEOUT_MS;

const server = http.createServer(app);
let socketLifecycle = null;
let dbConnection = null;
let isShuttingDown = false;

const waitForServerClose = () =>
  new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close((error) => {
      if (error) {
        console.error(
          "[collab-service] Error while closing HTTP server:",
          error,
        );
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
    `[collab-service] Received ${signal}. Starting graceful shutdown.`,
  );

  const forceExitTimer = setTimeout(() => {
    console.error(
      "[collab-service] Graceful shutdown timed out. Forcing exit.",
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await Promise.all([socketLifecycle?.close?.(), waitForServerClose()]);
    if (dbConnection?.close) {
      await dbConnection.close();
    }
    clearTimeout(forceExitTimer);
    console.log("[collab-service] Shutdown complete. Exiting.");
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error("[collab-service] Failed to shutdown cleanly:", error);
    process.exit(1);
  }
};

const signals = ["SIGTERM", "SIGINT"];
signals.forEach((signal) => {
  process.on(signal, () => {
    void gracefulShutdown(signal);
  });
});

async function start() {
  try {
    dbConnection = await connectDB();
    console.log("MongoDB Connected!");

    socketLifecycle = initSocket(server);
    app.locals.io = socketLifecycle.io;

    server.listen(PORT, () => {
      console.log(`[collab-service] Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("[collab-service] Failed to start:", error);
    process.exit(1);
  }
}

start();
