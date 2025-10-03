import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { QuestionDoc } from "./model/question";
import { Question } from "./model/question";
import type { ChangeStreamDocument } from "mongodb";
import mongoose from "mongoose";

export default fp((app: FastifyInstance) => {
  mongoose.connection.once("open", () => {
    app.log.info("[ChangeStream] Mongo connected, starting watcher");
    const changeStream = Question.watch([], { fullDocument: "updateLookup" });

    changeStream.on("change", (change: ChangeStreamDocument<QuestionDoc>) => {
      app.log.info({ change }, "[ChangeStream] new change event");
      // Example: forward or just log
      console.log("Change:", change);
    });

    changeStream.on("error", (err) => {
      app.log.error({ err }, "[ChangeStream] error in change stream");
    });

    app.addHook("onClose", async () => {
      await changeStream.close();
      app.log.info("[ChangeStream] closed");
    });
  });
});
