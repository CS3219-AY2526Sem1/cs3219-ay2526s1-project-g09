import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { Question } from "./model/question.js";
import type {
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamReplaceDocument,
  ChangeStreamUpdateDocument,
} from "mongodb";
import { type QuestionDoc } from "./types/question.js";
import axios from "axios";

const TOKEN = process.env.ADMIN_TOKEN ?? "";

/**
 * The URL of the question backend service.
 * Change this if the service is hosted elsewhere.
 */
const QUESTION_API_URL = process.env.QUESTION_API_URL;
if (!QUESTION_API_URL) {
  throw new Error("Environment variable QUESTION_API_URL must be set.");
}

function hasFullDocument<T>(
  c: ChangeStreamDocument<
    T extends mongoose.mongo.BSON.Document ? T : mongoose.mongo.BSON.Document
  >,
): c is
  | ChangeStreamInsertDocument<
      T extends mongoose.mongo.BSON.Document ? T : mongoose.mongo.BSON.Document
    >
  | ChangeStreamReplaceDocument<
      T extends mongoose.mongo.BSON.Document ? T : mongoose.mongo.BSON.Document
    >
  | ChangeStreamUpdateDocument<
      T extends mongoose.mongo.BSON.Document ? T : mongoose.mongo.BSON.Document
    > {
  return (
    c.operationType === "insert" ||
    c.operationType === "replace" ||
    c.operationType === "update"
  );
}

async function postDoc(doc: QuestionDoc) {
  try {
    const res = await axios.post(`${QUESTION_API_URL}/post-question`, doc, {
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": TOKEN,
      },
    });
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

    changeStream = Question.watch<QuestionDoc>(
      [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
      { fullDocument: "updateLookup" },
    );

    let processing = Promise.resolve();

    changeStream.on("change", (change: ChangeStreamDocument) => {
      app.log.info("[ChangeStream] Event");
      processing = processing.then(async () => {
        if (!hasFullDocument(change)) return;
        const doc = change.fullDocument as QuestionDoc;

        if (!doc) return;

        await postDoc(doc);
        app.log.info({ doc }, "Got changed document:");
      });
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
