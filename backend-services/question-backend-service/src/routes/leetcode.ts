/**
 * Routes including seeding leetcode questions.
 */
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import {
  getQuestionDetail,
  fetchAllNonPaidSlugs,
} from "../leetcode/service.js";
import { seedLeetCodeBatch } from "../services/seedBatch.js";
import { SeedCursor } from "../db/model/question.js";
import { withDbLimit } from "../db/dbLimiter.js";

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
    "/seed-batch",
    {
      config: { rateLimit: { max: 1, timeWindow: "1m" } },
    },
    async (req) => {
      assertAdmin(req);
      const reset = (req.query as { reset?: string })?.reset === "1";
      if (reset) {
        await withDbLimit(() => SeedCursor.findByIdAndDelete("questions"));
      }

      const res = await seedLeetCodeBatch();
      return res;
    },
  );

  app.get("/test", async () => {
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
};

export default leetcodeRoutes;
