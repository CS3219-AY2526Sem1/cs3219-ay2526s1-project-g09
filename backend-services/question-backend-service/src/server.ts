import Fastify from "fastify";
import cors from "@fastify/cors";
import leetcodeRoutes from "./routes/leetcode.js";
import db from "./plugins/db.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // plugins
  await app.register(cors, {
    origin: ["http://localhost:5285/api/v1/leetcode/seed-batch"],
  });
  await app.register(db);
  await app.register((await import("@fastify/rate-limit")).default, {
    global: false,
    timeWindow: "15m",
  });

  // routes
  await app.register(leetcodeRoutes, { prefix: "/api/v1" });

  return app;
}
