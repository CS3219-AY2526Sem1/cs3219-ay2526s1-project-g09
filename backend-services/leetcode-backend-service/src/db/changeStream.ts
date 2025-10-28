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
import { type SeedBatchResponse } from "./types/seedBatchResponse.js";
import { logger } from "../logger.js";

const TOKEN = process.env.ADMIN_TOKEN ?? "";

/**
 * The URL of the question backend service.
 * Change this if the service is hosted elsewhere.
 */
const QUESTION_API_URL = process.env.QUESTION_API_URL;
if (!QUESTION_API_URL) {
  throw new Error("QUESTION_API_URL environment variable must be set");
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
    const res = await axios.post<SeedBatchResponse>(
      `${QUESTION_API_URL}/add-question`,
      doc,
      {
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": TOKEN,
          "x-source": "leetcode",
        },
      },
    );
    logger.info("Seed-batch response", res.data);
  } catch (err) {
    logger.error("Error posting doc", err);
  }
}

export default fp((app: FastifyInstance) => {
  logger.info("[ChangeStream] Plugin registered");

  let changeStream: mongoose.mongo.ChangeStream | null = null;

  const startWatcher = () => {
    if (changeStream) return; // already started
    logger.info("[ChangeStream] Starting watcher");

    changeStream = Question.watch<QuestionDoc>(
      [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
      { fullDocument: "updateLookup" },
    );

    // Queue-based processing to avoid unbounded promise chains
    const changeQueue: ChangeStreamDocument[] = [];
    let isProcessing = false;
    async function processQueue() {
      if (isProcessing) return;
      isProcessing = true;
      while (changeQueue.length > 0) {
        const change = changeQueue.shift();
        if (!change) continue;
        try {
          if (!hasFullDocument(change)) continue;
          const doc = change.fullDocument as QuestionDoc;
          if (!doc) continue;
          await postDoc(doc);
          logger.info("Got changed document:", { doc });
        } catch (err) {
          logger.error("[ChangeStream] Error processing change event", { err });
        }
      }
      isProcessing = false;
    }
    changeStream.on("change", (change: ChangeStreamDocument) => {
      logger.info("[ChangeStream] Event");
      changeQueue.push(change);
      void processQueue();
    });

    changeStream.on("error", (err) => {
      logger.error("[ChangeStream] error", err);
    });

    changeStream.on("end", () => {
      logger.warn("[ChangeStream] ended");
      changeStream = null;
    });
  };

  // Start immediately if already connected; otherwise wait once for 'open'
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    logger.info("[ChangeStream] already connected");
    startWatcher();
  } else {
    mongoose.connection.once("open", () => {
      logger.info("[ChangeStream] 'open' fired");
      startWatcher();
    });
  }

  // Always register onClose at plugin scope
  app.addHook("onClose", async () => {
    logger.info("[ChangeStream] plugin onClose hook");
    try {
      await changeStream?.close();
    } catch (err) {
      logger.error("[ChangeStream] close failed", err);
    } finally {
      changeStream = null;
    }
  });
});
