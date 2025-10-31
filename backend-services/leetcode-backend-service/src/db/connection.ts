/**
 * Set up connection to MongoDB using Mongoose and integrate it with Fastify.
 */
import fp from "fastify-plugin";
import mongoose from "mongoose";
import type { FastifyInstance } from "fastify";
import { logger } from "../logger.js";

declare module "fastify" {
  interface FastifyInstance {
    mongo: typeof mongoose;
  }
}

export default fp(async (app: FastifyInstance) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
    try {
      await mongoose.connect(uri, {
        dbName: "leetcode-service",
        serverSelectionTimeoutMS: 10000,
      });
      logger.info("[Mongo] Connected");
    } catch (err) {
      logger.error("[Mongo] Connection failed: ", err);
      throw err;
    }
  } else {
    logger.info("[Mongo] Already connected");
  }

  app.decorate("mongo", mongoose);

  app.addHook("onClose", async () => {
    await mongoose.connection.close();
    logger.info("Mongo disconnected");
  });
});
