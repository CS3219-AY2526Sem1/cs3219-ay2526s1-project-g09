import Fastify from "fastify";
import cors from "@fastify/cors";
import healthRoutes from "./routes/health.js";
import leetcodeRoutes from "./routes/leetcode.js";
import db from "./plugins/db.js";
import rateLimit from "@fastify/rate-limit"

export async function buildServer() {
  const app = Fastify({ logger: true });
  
  // plugins
  await app.register(cors, { origin: "*" });
  await app.register(rateLimit, { global: false });
  await app.register(db);

  // routes
  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(leetcodeRoutes, { prefix: "/api/v1" });

  return app;
}
