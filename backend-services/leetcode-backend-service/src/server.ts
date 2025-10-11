import Fastify from "fastify";
import leetcodeRoutes from "./routes.js";
import db from "./db/connection.js";
import changeStream from "./db/changeStream.js";
import rateLimit from "@fastify/rate-limit";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // plugins
  await app.register(db);
  await app.register(changeStream);
  await app.register(rateLimit, {
    global: false,
    timeWindow: "15m",
    max: 100,
  });

  // routes
  await app.register(leetcodeRoutes, { prefix: "/api/v1/leetcode" });

  return app;
}
