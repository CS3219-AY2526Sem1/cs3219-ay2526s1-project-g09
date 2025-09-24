import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import {
  listFirstN,
  getQuestionDetail,
  fetchAllNonPaidSlugs,
} from "../services/leetcode.js";
import { Question } from "../models/question.js";
import { syncAllNonPaid } from "../services/leetcode.js";
import { seedLeetCodeBatch } from "../services/seedBatch.js";
import { SeedCursor } from "../models/question.js";
import { withDbLimit } from "../../lib/dblimiter.js";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function getHeader(req: FastifyRequest, name: string): string | undefined {
  const headers = req.headers as Record<string, unknown> | undefined;
  const value = headers?.[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function assertAdmin(req: FastifyRequest) {
  const token = getHeader(req, "x-admin-token");
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  app.post(
    "/leetcode/seed-batch",
    {
      config: { rateLimit: { max: 1, timeWindow: "1m" } },
    },
    async (req) => {
      assertAdmin(req);
      const reset = (req.query as { reset?: string })?.reset === "1";
      if (reset) {
        await SeedCursor.findByIdAndDelete("leetcode-questions");
      }

      const res = await seedLeetCodeBatch();
      return res;
    },
  );

  app.post(
    "/leetcode/seed-all",
    {
      config: { rateLimit: { max: 1, timeWindow: "5m" } },
    },
    async (req) => {
      assertAdmin(req);
      const res = await syncAllNonPaid();
      return { ok: true, ...res };
    },
  );

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

  // codeql[js/missing-rate-limiting]: Route is protected by @fastify/rate-limit
  app.post(
    "/leetcode/seed-first",
    {
      config: { rateLimit: { max: 5, timeWindow: "1m" } },
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
      const res = await withDbLimit(() =>
        Question.updateOne(
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
        ),
      );

      // Fetch the saved doc to return it
      const doc = await withDbLimit(() =>
        Question.findOne({ slug: first.titleSlug }).lean(),
      );
      return {
        ok: true,
        upserted: res.upsertedCount > 0,
        modified: res.modifiedCount > 0,
        doc,
      };
    },
  );
};

export default leetcodeRoutes;
