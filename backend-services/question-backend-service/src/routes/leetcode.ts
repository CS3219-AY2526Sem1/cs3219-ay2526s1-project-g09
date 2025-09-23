import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import { listFirstN, getQuestionDetail } from "../services/leetcode.js";
import { Question } from "../models/question.js";

// In-memory store for rate limiting (can be replaced with Redis)
const dbRateLimitStore: Map<string, { count: number; lastAccess: number }> =
  new Map();

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  app.get("/leetcode-test", async () => {
    const list = await listFirstN(5);
    const slugs = list.questions.map((q) => q.titleSlug);
    const firstSlug = slugs[0];
    const detail = firstSlug ? await getQuestionDetail(firstSlug) : null;

    return {
      ok: true,
      totalKnown: list.total,
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

  const postRateLimit = {
    preHandler: app.rateLimit({
      max: 3,
      timeWindow: 15 * 60 * 1000, // 15 min
    }),
  };

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
