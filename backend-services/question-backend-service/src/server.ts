import Fastify from "fastify";
import cors from "@fastify/cors";
import leetcodeRoutes from "./routes/leetcode.js";
import db from "./plugins/db.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // plugins
  await app.register(cors, { origin: "*" });
  await app.register(db);
  await app.register(import("@fastify/rate-limit"), {
    global: false,
    max: 5,
    timeWindow: "1 minute",
  });

  // routes
  await app.register(leetcodeRoutes, { prefix: "/api/v1" });

  return app;
}
