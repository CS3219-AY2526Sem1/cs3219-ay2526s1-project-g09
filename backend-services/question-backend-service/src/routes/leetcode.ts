import type { FastifyPluginAsync } from "fastify";
import { listFirstN, getQuestionDetail } from "../services/leetcode.js";

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
};

export default leetcodeRoutes;
