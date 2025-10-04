import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import axios from "axios";
import { type ChangeStreamDocument } from "mongodb";
import { Question } from "./model/question";
import type { QuestionDoc } from "./types/question";
import hasFullDocument from "mongodb";

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? "";
const TOKEN = process.env.QUESTIONS_SYNC_TOKEN ?? "";

export default fp((app: FastifyInstance) => {
  mongoose.connection.once("open", () => {
    app.log.info("[ChangeStream] Mongo connected, starting watcher");

    const changeStream = Question.watch(
      [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
      { fullDocument: "updateLookup" },
    );

    void (async () => {
      try {
        for await (const change of changeStream as AsyncIterable<
          ChangeStreamDocument<QuestionDoc>
        >) {
          const full = change.fullDocument;

          if (!full) {
            app.log.warn(
              { op: change.operationType },
              "[ChangeStream] missing fullDocument; skipping",
            );
            continue;
          }

          // Skip if env not set to avoid throwing in dev
          if (!QUESTION_SERVICE_URL) {
            app.log.warn(
              "[ChangeStream] QUESTION_SERVICE_URL is not set; skipping sync",
            );
            continue;
          }

          const payload: QuestionDoc = {
            source: full.source,
            globalSlug: `leetcode:${full.titleSlug}`,
            titleSlug: full.titleSlug,
            title: full.title,
            difficulty: full.difficulty,
            isPaidOnly: full.isPaidOnly,
            categoryTitle: full.categoryTitle ?? null,
            content: full.content ?? null,
            exampleTestcases: full.exampleTestcases ?? null,
            hints: full.hints ?? [],
            codeSnippets: full.codeSnippets ?? [],
            createdAt: full.createdAt,
            updatedAt: full.updatedAt,
          };

          // Retry with linear backoff
          let ok = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await axios.post(
                `${QUESTION_SERVICE_URL}/api/v1/questions/post-question`,
                payload,
                TOKEN ? { headers: { "x-sync-token": TOKEN } } : undefined,
              );

              app.log.info(
                { op: change.operationType, slug: full.titleSlug },
                "[ChangeStream] Synced",
              );
              ok = true;
              break;
            } catch (e: unknown) {
              const message =
                e instanceof Error ? e.message : "Unknown error during sync";
              app.log.warn(
                { attempt, message, slug: full.titleSlug },
                "[ChangeStream] Sync failed",
              );
              if (attempt < 3) {
                await new Promise((r) => setTimeout(r, 1000 * attempt));
              }
            }
          }

          if (!ok) {
            app.log.error(
              { slug: full.titleSlug },
              "[ChangeStream] Giving up after 3 attempts",
            );
            // optional: push to a DLQ here
          }

          app.log.debug(
            { op: change.operationType },
            "[ChangeStream] processed event",
          );
        }

        app.log.info("[ChangeStream] stream ended");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error in async iterator";
        app.log.error({ message }, "[ChangeStream] iterator crashed");
      }
    })();

    changeStream.on("error", (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      app.log.error({ message }, "[ChangeStream] error in change stream");
    });

    app.addHook("onClose", async () => {
      await changeStream.close();
      app.log.info("[ChangeStream] closed");
    });
  });
});
