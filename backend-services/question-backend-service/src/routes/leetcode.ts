import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
  listFirstN,
  getQuestionDetail,
  fetchAllNonPaidSlugs,
} from "../services/leetcode.js";
import { Question } from "../models/question.js";
import { syncAllNonPaid } from "../services/leetcode.js";
import { seedLeetCodeBatch } from "../services/seedBatch.js";
import { SeedCursor } from "../models/question.js";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function assertAdmin(req: any) {
  const token = req.headers["x-admin-token"];
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    const err = new Error("Unauthorized");
    throw err;
  }
}

// In-memory store for rate limiting (can be replaced with Redis)
const dbRateLimitStore: Map<string, { count: number; lastAccess: number }> =
  new Map();

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  const postRateLimit = {
    preHandler: app.rateLimit({
      max: 10,
      timeWindow: 15 * 60 * 1000, // 15 min
    }),
  };

  app.post("/leetcode/seed-batch", postRateLimit, async (req) => {
    const reset = (req.query as { reset?: string })?.reset === "1";
    if (reset) {
      await SeedCursor.findByIdAndDelete("leetcode-questions");
    }

    const res = await seedLeetCodeBatch();
    return res;
  });

  app.post("/leetcode/seed-all", async (req) => {
    assertAdmin(req);
    const res = await syncAllNonPaid();
    return { ok: true, ...res };
  });

  app.get("/leetcode-test", async () => {
    const list = await fetchAllNonPaidSlugs();
    const slugs = list.map((q) => q.titleSlug);
    const firstSlug = slugs[0];
    const detail = firstSlug ? await getQuestionDetail(firstSlug) : null;

    return {
      ok: true,
      titleSlugs: slugs,
      title: detail?.title ?? null,
      isPaidOnly: detail?.isPaidOnly,
      difficulty: detail?.difficulty,
      categoryTitle: detail?.categoryTitle ?? null,
      content: detail?.content ?? null,
      exampleTestcases: detail?.exampleTestcases ?? null,
      codeSnippets: detail?.codeSnippets,
      hints: detail?.hints ?? null,
    };
  });

  // POST /leetcode/seed-first — fetch first question and upsert into MongoDB
  app.post("/leetcode/seed-first", postRateLimit, async (request, reply) => {
    const ip = request.ip; // Rate limit by IP address

    // Implement database-specific rate limiting
    const currentTime = Date.now();
    const rateLimitWindow = 15 * 60 * 1000; // 15 minute
    const rateLimitMax = 10;

    if (dbRateLimitStore.has(ip)) {
      const data = dbRateLimitStore.get(ip)!;
      if (currentTime - data.lastAccess < rateLimitWindow) {
        if (data.count >= rateLimitMax) {
          return reply.status(429).send({
            ok: false,
            message:
              "Database access rate limit exceeded. Please try again later.",
          });
        }
        data.count += 1;
      } else {
        dbRateLimitStore.set(ip, { count: 1, lastAccess: currentTime });
      }
    } else {
      dbRateLimitStore.set(ip, { count: 1, lastAccess: currentTime });
    }

    const list = await listFirstN(1);
    const first = list.questions[0];
    if (!first) {
      return { ok: false, message: "No questions returned from LeetCode." };
    }

    const detail = await getQuestionDetail(first.titleSlug);
    if (!detail) {
      return { ok: false, message: "Could not fetch question detail." };
    }

    // Upsert by slug
    const res = await Question.updateOne(
      { slug: first.titleSlug },
      {
        $set: {
          titleSlug: first.titleSlug,
          title: detail.title,
          isPaidOnly: detail?.isPaidOnly,
          difficulty: detail?.difficulty,
          categoryTitle: detail?.categoryTitle ?? null,
          content: detail?.content ?? null,
          exampleTestcases: detail?.exampleTestcases ?? null,
          codeSnippets: detail?.codeSnippets,
          hints: detail?.hints ?? null,
        },
      },
      { upsert: true },
    );

    // Fetch the saved doc to return it
    const doc = await Question.findOne({ slug: first.titleSlug }).lean();
    return {
      ok: true,
      upserted: res.upsertedCount > 0,
      modified: res.modifiedCount > 0,
      doc,
    };
  });
};

export default leetcodeRoutes;
