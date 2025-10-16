import Fastify from "fastify";
import cors from "@fastify/cors";
import leetcodeRoutes from "./routes.js";
import db from "./db/connection.js";
import rateLimit from "@fastify/rate-limit";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // plugins
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }); // will need to change this in production
  await app.register(db);
  await app.register(rateLimit, {
    global: false,
    timeWindow: "15m",
    max: 100,
  });

  // routes
  await app.register(leetcodeRoutes, { prefix: "/api/v1/question-service" });

  return app;
}
