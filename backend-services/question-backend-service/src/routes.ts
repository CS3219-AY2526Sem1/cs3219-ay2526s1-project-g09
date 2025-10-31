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
import type { QuestionQuery } from "./db/types/questionQuery.js";

if (!process.env.ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN environment variable must be set");
}

type Difficulty = "Easy" | "Medium" | "Hard";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const MAX_TIME_LIMIT_MINUTES = 240;

/**
 * Extract a header value from the request.
 * Returns undefined if the header is not present or not a string.
 *
 * @param req The Fastify request object.
 * @param name The name of the header to extract.
 * @returns The header value or undefined.
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

/**
 * Questions routes plugin.
 * @param app The Fastify instance.
 */
const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  /**
   * Health check endpoint.
   * Returns 200 OK if the service is running.
   */
  app.get("/health", async (_req, reply) => {
    return reply.send({ ok: true });
  });

  /**
   * Get a random question based on categoryTitle and difficulty.
   * Returns 200 with the question document.
   * Returns 400 if the body is malformed or missing data.
   * Returns 404 if no question found.
   * Returns 500 on MongoDB server error.
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
   * Get a paginated list of question previews.
   * Supports filtering by title, category, difficulty, time limits.
   * Supports sorting by various fields.
   * Returns 200 with paginated question previews.
   * Returns 400 if query params are invalid.
   * Returns 500 on MongoDB server error.
   */
  app.get("/questions", async (req, reply) => {
    // Define schema for validation
    const QuerySchema = z.object({
      title: z.string().optional(),
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

    const {
      title,
      category,
      difficulty,
      minTime,
      maxTime,
      size,
      page,
      sortBy,
    } = parsed.data;

    // Build MongoDB query
    const query: QuestionQuery = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }
    if (category) query.categoryTitle = category;
    if (difficulty) query.difficulty = difficulty;
    if (minTime || maxTime) {
      const timeLimitQuery: { $gte?: number; $lte?: number } = {};
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
   * Get all distinct categories from questions.
   * Returns 200 with array of categories.
   * Returns 500 on MongoDB server error.
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
   * Get all distinct difficulties from questions.
   * Returns 200 with array of difficulties.
   * Returns 500 on MongoDB server error.
   */
  app.get("/questions/difficulties", async (_req, reply) => {
    try {
      const difficulties = await withDbLimit(() =>
        Question.distinct("difficulty"),
      );
      return reply.send({ difficulties });
    } catch (err: unknown) {
      if (err instanceof Error) {
        _req.log?.error({ err }, "Failed to fetch question difficulties");
        return reply.status(500).send({ error: err.message });
      }
      _req.log?.error({ err }, "Failed to fetch question difficulties");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Get categories with their distinct difficulties.
   * Returns 200 with map of category titles to arrays of distinct difficulties.
   * Returns 500 on MongoDB server error.
   * Sample Response:
   * {
   *   "OOP": ["Easy", "Medium"],
   *   "Database": ["Hard"]
   * }
   */
  app.get("/questions/categories-with-difficulties", async (_req, reply) => {
    try {
      // Explicitly type aggregation result
      interface CategoryDifficultyGroup {
        _id: {
          categoryTitle: string;
          difficulty: string;
        };
      }

      const results = await withDbLimit(() =>
        Question.aggregate<CategoryDifficultyGroup>([
          {
            $group: {
              _id: {
                categoryTitle: "$categoryTitle",
                difficulty: "$difficulty",
              },
            },
          },
        ]),
      );

      const categoriesMap: Record<string, string[]> = {};
      const difficultyOrder = ["Easy", "Medium", "Hard"] as const;

      for (const entry of results) {
        const { categoryTitle, difficulty } = entry._id;
        if (!categoryTitle || !difficulty) continue;

        const key = String(categoryTitle);
        const value = String(difficulty);

        if (!categoriesMap[key]) {
          categoriesMap[key] = [];
        }

        if (!categoriesMap[key].includes(value)) {
          categoriesMap[key].push(value);
        }
      }

      // Sort difficulties in canonical order
      for (const key of Object.keys(categoriesMap)) {
        const diffs = categoriesMap[key];
        if (!diffs) {
          continue;
        }
        diffs.sort(
          (a, b) =>
            difficultyOrder.indexOf(a as (typeof difficultyOrder)[number]) -
            difficultyOrder.indexOf(b as (typeof difficultyOrder)[number]),
        );
      }

      return reply.send(categoriesMap);
    } catch (err: unknown) {
      _req.log?.error({ err }, "Failed to fetch categories with difficulties");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Add a new question.
   * Requests must include x-admin-token and x-source headers.
   * Returns 200 with the ID of the newly created question.
   * Returns 400 if the body is malformed, or required headers are missing/invalid.
   * Returns 401 if unauthorized.
   * Returns 409 if a question with the same title already exists.
   * Returns 500 on MongoDB server error.
   */
  app.post("/add-question", async (req, res) => {
    const token = getHeader(req, "x-admin-token");
    if (!ADMIN_TOKEN || !token || !safeCompare(token, ADMIN_TOKEN)) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const source = getHeader(req, "x-source");
    if (!source) {
      return res
        .status(400)
        .send({ error: "Missing required header: x-source" });
    }

    const allowedSources = ["admin", "leetcode"];
    if (!allowedSources.includes(source)) {
      return res.status(400).send({
        error: `Invalid source: ${source}. Must be one of ${allowedSources.join(", ")}`,
      });
    }

    const Body = z.object({
      title: z.string().min(1, "Title is required"),
      titleSlug: z.string().min(1).optional(),
      categoryTitle: z.string().max(100, "Category title is required"),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      timeLimit: z.number().min(1).max(MAX_TIME_LIMIT_MINUTES),
      content: z.string().min(1, "Content is required"),
      hints: z.array(z.string()).optional(),
      answer: z.string().optional(),
      exampleTestcases: z.string().optional(),
      codeSnippets: z
        .array(
          z.object({
            lang: z.string(),
            langSlug: z.string(),
            code: z.string(),
          }),
        )
        .optional(),
    });

    const result = Body.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .send({ error: "Invalid input", details: result.error.issues });
    }

    const data = result.data;

    // Check for title uniqueness
    const existing = await withDbLimit(() =>
      Question.findOne({ title: data.title }).lean(),
    );

    if (existing) {
      return res.status(409).send({
        ok: false,
        message: "A question with this title already exists",
        existingId: existing._id.toString(),
      });
    }

    // Auto-generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const globalSlug = `${source}:${slug}`;

    const doc = {
      source,
      globalSlug,
      titleSlug: slug,
      title: data.title,
      categoryTitle: data.categoryTitle,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      content: data.content,
      hints: data.hints && data.hints.length > 0 ? data.hints : null,
      exampleTestcases: data.exampleTestcases ?? null,
      codeSnippets: data.codeSnippets ?? null,
      answer: data.answer ?? null,
    };

    try {
      const savedDoc = await withDbLimit(() => Question.create(doc));

      return res.status(200).send({
        ok: true,
        id: savedDoc._id.toString(),
        message: "Question created successfully",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to add question");
        return res.status(500).send({ error: err.message });
      }
      return res.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Get question details by ID.
   * Returns 200 with question details.
   * Returns 400 if the ID is invalid.
   * Returns 404 if the question is not found.
   * Returns 500 on MongoDB server error.
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
        answer: question.answer ?? "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to fetch question details");
        return reply.status(500).send({ error: err.message });
      }
      req.log?.error({ err }, "Failed to fetch question details");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Update question details by ID.
   * Must include x-admin-token header.
   * Returns 200 with the ID of the updated question.
   * Returns 400 if the ID is invalid or the body is malformed.
   * Returns 401 if unauthorized.
   * Returns 404 if the question is not found.
   * Returns 500 on MongoDB server error.
   */
  app.put<{
    Params: { id: string };
    Body: {
      title?: string;
      categoryTitle?: string;
      difficulty?: Difficulty;
      timeLimit?: number;
      content?: string;
      hints?: string[];
      answer?: string;
    };
  }>("/questions/:id", async (req, reply) => {
    const token = getHeader(req, "x-admin-token");
    if (!ADMIN_TOKEN || !token || !safeCompare(token, ADMIN_TOKEN)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: "Invalid question ID" });
    }

    // Validate body using Zod
    const BodySchema = z.object({
      title: z.string().min(1).optional(),
      categoryTitle: z.string().max(100).optional(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      timeLimit: z.number().min(1).max(MAX_TIME_LIMIT_MINUTES).optional(),
      content: z.string().min(1).optional(),
      hints: z.array(z.string()).optional(),
      answer: z.string().optional(),
    });

    type UpdateData = z.infer<typeof BodySchema> & {
      titleSlug?: string;
      globalSlug?: string;
    };

    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "Invalid input", details: parsed.error.issues });
    }

    const updateData: UpdateData = parsed.data;

    if (updateData.title) {
      const slug = updateData.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      updateData.titleSlug = slug;
      updateData.globalSlug = slug;
    }

    try {
      const updated = await withDbLimit(() =>
        Question.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true, lean: true },
        ),
      );

      if (!updated) {
        return reply.status(404).send({ error: "Question not found" });
      }

      return reply.send({
        ok: true,
        message: "Question updated successfully",
        questionId: updated._id.toString(),
        title: updated.title,
        titleSlug: updated.titleSlug,
        globalSlug: updated.globalSlug,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to update question");
        return reply.status(500).send({ error: err.message });
      }
      req.log?.error({ err }, "Failed to update question");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Deletes a question from the database by ID.
   * Must include x-admin-token header.
   * Returns 200 with the ID of the deleted question.
   * Returns 400 if the ID is invalid.
   * Returns 401 if unauthorized.
   * Returns 404 if the question is not found.
   * Returns 500 on MongoDB server error.
   */
  app.delete<{
    Params: { id: string };
  }>("/questions/:id", async (req, reply) => {
    const token = getHeader(req, "x-admin-token");
    if (!ADMIN_TOKEN || !token || !safeCompare(token, ADMIN_TOKEN)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: "Invalid question ID" });
    }

    try {
      const deleted = await withDbLimit(() =>
        Question.findByIdAndDelete(id).lean(),
      );

      if (!deleted) {
        return reply.status(404).send({ error: "Question not found" });
      }

      return reply.send({
        ok: true,
        message: "Question deleted successfully",
        deletedId: id,
        title: deleted.title,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        req.log?.error({ err }, "Failed to delete question");
        return reply.status(500).send({ error: err.message });
      }
      req.log?.error({ err }, "Failed to delete question");
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};

export default leetcodeRoutes;
