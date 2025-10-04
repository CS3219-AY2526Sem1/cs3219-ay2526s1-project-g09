import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { Question } from "./model/question"; // if you use Question.watch()
import type { ChangeStreamDocument } from "mongodb";
import { type QuestionDoc } from "./types/question";
import axios from "axios";

const TOKEN = process.env.ADMIN_TOKEN ?? "";

async function postDoc(doc: QuestionDoc) {
  try {
    const res = await axios.post(
      `http://localhost:5275/api/v1/questions/post-question`,
      doc,
      {
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": TOKEN,
        },
      },
    );
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Error posting doc:", err);
  }
}

export default fp((app: FastifyInstance) => {
  app.log.info("[ChangeStream] Plugin registered");

  let changeStream: mongoose.mongo.ChangeStream | null = null;

  const startWatcher = () => {
    if (changeStream) return; // already started
    app.log.info("[ChangeStream] Starting watcher");

    changeStream = Question.watch(
      [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
      { fullDocument: "updateLookup" },
    );

    changeStream.on("change", async (change: ChangeStreamDocument) => {
      app.log.info("[ChangeStream] Event");
      const doc = change.fullDocument;
      await postDoc(doc);

      if (!doc) {
        console.warn("Change event without fullDocument:", change);
        return;
      }

      console.log("Got changed document:", doc);
    });

    changeStream.on("error", (err) => {
      app.log.error({ err }, "[ChangeStream] error");
    });

    changeStream.on("end", () => {
      app.log.warn("[ChangeStream] ended");
      changeStream = null;
    });
  };

  // Start immediately if already connected; otherwise wait once for 'open'
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    app.log.info("[ChangeStream] already connected");
    startWatcher();
  } else {
    mongoose.connection.once("open", () => {
      app.log.info("[ChangeStream] 'open' fired");
      startWatcher();
    });
  }

  // Always register onClose at plugin scope
  app.addHook("onClose", async () => {
    app.log.info("[ChangeStream] plugin onClose hook");
    try {
      await changeStream?.close();
    } catch (e) {
      app.log.error({ e }, "[ChangeStream] close failed");
    } finally {
      changeStream = null;
    }
  });
});
