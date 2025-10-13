/**
 * Routes including seeding leetcode questions.
 */
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import { type QuestionDoc } from "./db/model/question.js";
import { withDbLimit } from "./db/dbLimiter.js";
import { Question } from "./db/model/question.js";
import { z } from "zod";
import crypto from "crypto";

if (!process.env.ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN environment variable must be set");
}
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const MAX_TIME_LIMIT_MINUTES = 240;

/**
 * Extract a header value from the request.
 * Returns undefined if the header is not present or not a string.
 */

function getHeader(req: FastifyRequest, name: string): string | undefined {
  const headers = req.headers as Record<string, unknown> | undefined;
  const value = headers?.[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

/**
 * Safely compares two strings for equality.
 * Prevents timing attacks.
 *
 * @param a The first string.
 * @param b The second string.
 * @returns True if the strings are equal, false otherwise.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  app.get("/health", async (_req, reply) => {
    return reply.send({ ok: true });
  });

  /**
   * Check if questions exist based on categoryTitle and difficulty.
   * Returns 400 if the body is malformed or missing data.
   * Returns a list of true/false for each category and difficulty combination.
   */
  app.post<{
    Body: {
      categories: {
        [category: string]: ("Easy" | "Medium" | "Hard")[]; // category as key and difficulty levels as values
      };
    };
  }>("/exists-categories-difficulties", async (req, reply) => {
    const { categories } = req.body;

    if (!categories || Object.keys(categories).length === 0) {
      return reply.status(400).send({
        error: "Missing required body: categories",
      });
    }

    const result: {
      [category: string]: {
        [difficulty in "Easy" | "Medium" | "Hard"]?: boolean;
      };
    } = {};

    // Iterate through the categories and check for each difficulty
    for (const [categoryTitle, difficulties] of Object.entries(categories)) {
      result[categoryTitle] = {};

      for (const difficulty of difficulties) {
        const exists = await withDbLimit(() =>
          Question.exists({ categoryTitle, difficulty }),
        );
        result[categoryTitle][difficulty] = !!exists;
      }
    }

    return reply.send(result);
  });

  /**
   * Get a random question based on categoryTitle and difficulty.
   * Returns 400 if params are missing.
   * Returns 404 if no question found.
   * Returns the question document if found.
   */
  app.post<{
    Body: {
      categories: { [category: string]: ("Easy" | "Medium" | "Hard")[] }; // categoryTitle as key, array of difficulties as value
    };
  }>("/random", async (req, reply) => {
    const { categories } = req.body;

    if (!categories || Object.keys(categories).length === 0) {
      return reply.status(400).send({
        error: "Missing required parameter: categories",
      });
    }

    const allQuestions = [];

    // Gather all questions based on the provided categories and difficulties
    for (const categoryTitle in categories) {
      const difficulties = categories[categoryTitle];
      if (!difficulties || difficulties.length === 0) continue;

      // Retrieve all questions for each categoryTitle and difficulty combination
      for (const difficulty of difficulties) {
        const questions = await withDbLimit(() =>
          Question.aggregate<QuestionDoc>([
            { $match: { categoryTitle, difficulty } },
          ]),
        );

        allQuestions.push(...questions);
      }
    }

    if (allQuestions.length === 0) {
      return reply.status(404).send({
        error:
          "No questions found for the provided categories and difficulties",
      });
    }

    // Choose a random question from the gathered pool
    const randomQuestion =
      allQuestions[Math.floor(Math.random() * allQuestions.length)];

    return reply.status(200).send(randomQuestion);
  });

  /**
   * Post a new question to the database.
   * Only create if it does not already exist.
   * If it already exists, return 200 with a message.
   */
  app.post("/post-question", async (req, res) => {
    const token = getHeader(req, "x-admin-token");
    if (!ADMIN_TOKEN || !token || !safeCompare(token, ADMIN_TOKEN)) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    const Body = z.object({
      source: z.string(),
      globalSlug: z.string().min(1),
      titleSlug: z.string().min(1),
      title: z.string().min(1),
      categoryTitle: z.string().max(100),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      timeLimit: z.number().min(1).max(MAX_TIME_LIMIT_MINUTES), // in minutes
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
    const doc = result.data;

    const saved = await withDbLimit(() =>
      Question.updateOne(
        { globalSlug: doc.globalSlug },
        { $setOnInsert: doc },
        { upsert: true },
      ),
    );
    if (saved.acknowledged !== true)
      return res.status(500).send({ error: "Failed to save question" });
    if (saved.matchedCount > 0)
      return res
        .status(200)
        .send({ ok: true, message: "Question already exists" });
    if (saved.upsertedCount === 0)
      return res.status(500).send({ error: "Failed to save question" });
    return res.status(200).send({
      ok: true,
      id: saved.upsertedId?.toString(),
      message: "Question inserted successfully",
    });
  });
};

export default leetcodeRoutes;
