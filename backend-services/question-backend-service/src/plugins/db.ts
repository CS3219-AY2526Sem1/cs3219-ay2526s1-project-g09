import fp from "fastify-plugin";
import mongoose from "mongoose";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    mongo: typeof mongoose;
  }
}

export default fp(async (app: FastifyInstance) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  app.log.info("Mongo connected");
  app.decorate("mongo", mongoose);

  app.addHook("onClose", async () => {
    await mongoose.connection.close();
    app.log.info("Mongo disconnected");
  });
});
