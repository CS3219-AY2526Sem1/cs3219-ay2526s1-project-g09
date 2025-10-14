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
import { Types } from "mongoose";

if (!process.env.ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN environment variable must be set");
}

type Difficulty = "Easy" | "Medium" | "Hard";

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
        error: "Missing required body: categories",
      });
    }

    const pairs = Object.entries(categories).flatMap(
      ([categoryTitle, diffs]) =>
        Array.isArray(diffs) && diffs.length
          ? diffs.map((difficulty) => ({ categoryTitle, difficulty }))
          : [],
    );

    if (pairs.length === 0) {
      return reply
        .status(400)
        .send({ error: "No (category, difficulty) pairs provided" });
    }

    const valid: Difficulty[] = ["Easy", "Medium", "Hard"];
    for (const p of pairs) {
      if (!valid.includes(p.difficulty as Difficulty)) {
        return reply
          .status(400)
          .send({ error: `Invalid difficulty '${p.difficulty}'` });
      }
    }

    try {
      // Single aggregation: pool all matches, then pick 1 at random
      const [randomQuestion] = await withDbLimit(() =>
        Question.aggregate<QuestionDoc>([
          { $match: { $or: pairs } },
          { $sample: { size: 1 } },
        ]),
      );

      if (!randomQuestion) {
        return reply.status(404).send({ error: "No question found" });
      }

      return reply.send(randomQuestion);
    } catch (err) {
      req.log?.error({ err }, "Failed to fetch random question");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
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

  /**
   * GET /questions
   * Supports filtering, pagination, and sorting.
   */
  app.get("/questions", async (req, reply) => {
    // Define schema for validation
    const QuerySchema = z.object({
      category: z.string().optional(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      minTime: z.coerce.number().int().min(1).optional(),
      maxTime: z.coerce.number().int().min(1).optional(),
      size: z.coerce.number().int().min(1).max(100).default(10),
      page: z.coerce.number().int().min(1).default(1),
      sortBy: z
        .enum(["newest", "oldest", "easiest", "hardest", "shortest", "longest"])
        .default("newest"),
    });

    // Validate query
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "Invalid query params", details: parsed.error.issues });
    }

    const { category, difficulty, minTime, maxTime, size, page, sortBy } =
      parsed.data;

    // Build MongoDB query
    const query: Record<string, any> = {};
    if (category) query.categoryTitle = category;
    if (difficulty) query.difficulty = difficulty;
    if (minTime || maxTime) {
      const timeLimitQuery: Record<string, number> = {};
      if (minTime) timeLimitQuery.$gte = minTime;
      if (maxTime) timeLimitQuery.$lte = maxTime;
      query.timeLimit = timeLimitQuery;
    }

    // Pagination
    const skip = (page - 1) * size;

    // Sorting
    const sortOptions: Record<string, 1 | -1> = (() => {
      switch (sortBy) {
        case "oldest":
          return { createdAt: 1 };
        case "newest":
          return { createdAt: -1 };
        case "easiest":
          return { difficulty: 1 };
        case "hardest":
          return { difficulty: -1 };
        case "shortest":
          return { timeLimit: 1 };
        case "longest":
          return { timeLimit: -1 };
        default:
          return { createdAt: -1 };
      }
    })();

    try {
      const [total, questions] = await withDbLimit(async () => {
        const total = await Question.countDocuments(query);
        const questions = await Question.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(size)
          .select("title categoryTitle difficulty timeLimit _id")
          .lean();
        return [total, questions] as const;
      });

      const previews = questions.map((q) => ({
        questionId: q._id.toString(),
        questionName: q.title,
        topic: q.categoryTitle ?? "Uncategorized",
        difficulty: q.difficulty,
        timeLimit: q.timeLimit?.toString() ?? "-",
      }));

      return reply.send({
        page,
        size,
        total,
        questions: previews,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to fetch questions");
        return reply.status(500).send({ error: err.message });
      }
      req.log?.error({ err }, "Failed to fetch questions");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * GET /questions/categories
   * Returns a list of distinct categories from questions.
   */
  app.get("/questions/categories", async (_req, reply) => {
    try {
      const categories = await withDbLimit(() =>
        Question.distinct("categoryTitle"),
      );
      return reply.send({ categories });
    } catch (err) {
      _req.log?.error({ err }, "Failed to fetch categories");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * GET /questions/difficulties
   * Returns all distinct difficulties from questions.
   */
  app.get("/questions/difficulties", async (_req, reply) => {
    try {
      const difficulties = await withDbLimit(() =>
        Question.distinct("difficulty"),
      );
      return reply.send({ difficulties });
    } catch (err) {
      return reply.status(500).send({ error: "Failed to fetch difficulties" });
    }
  });

  /**
   * GET /questions/:id
   * Returns full question details for a given ID.
   */
  app.get<{
    Params: { id: string };
  }>("/questions/:id", async (req, reply) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: "Invalid question ID" });
    }

    try {
      const question = await withDbLimit(() => Question.findById(id).lean());

      if (!question) {
        return reply.status(404).send({ error: "Question not found" });
      }

      return reply.send({
        questionId: question._id.toString(),
        title: question.title,
        categoryTitle: question.categoryTitle,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
        content: question.content,
        hints: question.hints ?? [],
        exampleTestcases: question.exampleTestcases ?? "",
        codeSnippets: question.codeSnippets ?? [],
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to fetch details");
        return reply.status(500).send({ error: err.message });
      }
      req.log?.error({ err }, "Failed to fetch details");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};

export default leetcodeRoutes;
