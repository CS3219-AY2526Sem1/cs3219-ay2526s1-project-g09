import type { FastifyPluginAsync } from "fastify";
import { listFirstN, getQuestionDetail } from "../services/leetcode.js";
import { Question } from "../models/question.js";

const leetcodeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/leetcode-test", async () => {
    const list = await listFirstN(5);
    const slugs = list.questions.map((q) => q.titleSlug);
    const firstSlug = slugs[0];
    const detail = firstSlug ? await getQuestionDetail(firstSlug) : null;

    return {
      ok: true,
      totalKnown: list.total,
      firstPageSlugs: slugs,
      firstTitle: detail?.title ?? null,
      content: detail?.content ?? null,
    };
  });

  // POST /leetcode/seed-first — fetch first question and upsert into MongoDB
  app.post("/leetcode/seed-first", 
    {
      // per-route rate limits
      config: {
        rateLimit: {
          max: 3,              
          timeWindow: "1 minute"
        },
      },
    },
      async () => {
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
          slug: first.titleSlug,
          title: detail.title,
          content: detail.content, // HTML string
        },
      },
      { upsert: true }
    );

    // Fetch the saved doc to return it
    const doc = await Question.findOne({ slug: first.titleSlug }).lean();
    return { ok: true, upserted: res.upsertedCount > 0, modified: res.modifiedCount > 0, doc };
  });
};

export default leetcodeRoutes;
