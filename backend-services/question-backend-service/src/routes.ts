/**
 * Routes including seeding leetcode questions.
 */
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import { SeedCursor, type QuestionDoc } from "./db/model/question.js";
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

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  app.get("/health", () => {
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

    const exists = await withDbLimit(() =>
      Question.exists({ categoryTitle, difficulty }),
    );
    return !!exists; // returns just true or false
  });

  app.get<{
    Querystring: {
      categoryTitle: string;
      difficulty: "Easy" | "Medium" | "Hard";
    };
  }>("/random", async (req, reply) => {
    const { categoryTitle, difficulty } = req.query;

    if (!categoryTitle || !difficulty) {
      return reply.status(400).send({ error: "Missing params" });
    }

    const [randomQuestion] = await withDbLimit(() =>
      Question.aggregate<QuestionDoc>([
        { $match: { categoryTitle, difficulty } },
        { $sample: { size: 1 } }, // MongoDB picks 1 random document
      ]),
    );

    if (!randomQuestion) {
      return reply.status(404).send({ error: "No question found" });
    }

    return randomQuestion;
  });

  app.post(
    "/post-question",
    {
      config: { rateLimit: { max: 200, timeWindow: "1m" } },
    },
    async (req, res) => {
      const token = getHeader(req, "x-admin-token");
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        return res.status(401).send({ error: "Unauthorized" });
      }
      const reset = (req.query as { reset?: string })?.reset === "1";
      if (reset) {
        await withDbLimit(() => SeedCursor.findByIdAndDelete("questions"));
      }
      const Body = z.object({
        source: z.string(),
        globalSlug: z.string().min(1),
        titleSlug: z.string().min(1),
        title: z.string().min(1),
        categoryTitle: z.string().max(100),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        content: z.string(),
        hints: z.array(z.string()).nullable().optional(),
        exampleTestcases: z.string().nullable().optional(),
        codeSnippets: z
          .array(
            z.object({
              lang: z.string(),
              langSlug: z.string(),
              code: z.string(),
            }),
          )
          .nullable()
          .optional(),
      });
      const result = Body.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send({ error: "Invalid input", details: result.error.issues });
      }
      const parsed = result.data;
      const { source, titleSlug, categoryTitle, difficulty } = parsed;
      const doc = {
        ...parsed,
      };

      const saved = await withDbLimit(() =>
        Question.findOneAndUpdate(
          { source, titleSlug, categoryTitle, difficulty },
          { $set: doc },
          { new: true, upsert: true },
        ),
      );

      return { ok: true, id: saved._id.toString(), updatedAt: saved.updatedAt };
    },
  );
};

export default leetcodeRoutes;
