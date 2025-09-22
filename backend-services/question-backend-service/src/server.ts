import Fastify from "fastify";
import cors from "@fastify/cors";
import healthRoutes from "./routes/health.js";
import leetcodeRoutes from "./routes/leetcode.js";
import db from "./plugins/db.js";
import rateLimit from "@fastify/rate-limit";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // plugins
  await app.register(cors, { origin: "*" });
  await app.register(rateLimit, {
    global: false,
    max: 5,
    timeWindow: "60s",
    keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip,
    errorResponseBuilder: (_req, context) => ({
      ok: false,
      code: "RATE_LIMITED",
      message: "Too many requests, please slow down.",
      retryAfterMs: context.after,
      limit: context.max,
    }),
  });
  await app.register(db);

  // routes
  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(leetcodeRoutes, { prefix: "/api/v1" });

  return app;
}
