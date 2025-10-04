/**
 * Routes including seeding leetcode questions.
 */
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import { SeedCursor } from "./db/model/question.js";
import { withDbLimit } from "./db/dbLimiter.js";
import { Question } from "./db/model/question.js";
import { z } from "zod";

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
  app.get("/health", async () => {
    return { ok: true };
  });

  app.get<{
    Querystring: {
      categoryTitle: string;
      difficulty: "Easy" | "Medium" | "Hard";
    };
  }>("/exists", async (req, reply) => {
    const { categoryTitle, difficulty } = req.query;

    if (!categoryTitle || !difficulty) {
      return reply.status(400).send(false);
    }

    const exists = await Question.exists({ categoryTitle, difficulty });
    return !!exists; // returns just true or false
  });

  app.post(
    "/post-question",
    {
      config: { rateLimit: { max: 200, timeWindow: "1m" } },
    },
    async (req, res) => {
      assertAdmin(req);
      const reset = (req.query as { reset?: string })?.reset === "1";
      if (reset) {
        await withDbLimit(() => SeedCursor.findByIdAndDelete("questions"));
      }
      const Body = z.object({
        source: z.string(),
        globalSlug: z.string(),
        titleSlug: z.string(),
        categoryTitle: z.string().max(100),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        isPaidOnly: z.boolean(),
        content: z.string(),
      });
      const parsed = Body.parse(req.body);
      const { source, titleSlug, categoryTitle, difficulty } = parsed;
      const doc = {
        ...parsed,
      };

      const saved = await Question.findOneAndUpdate(
        { source, titleSlug, categoryTitle, difficulty },
        { $set: doc },
        { new: true, upsert: true },
      );

      return { ok: true, id: saved._id.toString(), updatedAt: saved.updatedAt };
    },
  );
};

export default leetcodeRoutes;
