/**
 * Routes for seeding LeetCode questions.
 * These routes are protected by an admin token set in the environment variable ADMIN_TOKEN.
 * The token must be provided in the `x-admin-token` header of the request.
 */
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
} from "fastify";
import { seedLeetCodeBatch } from "./leetcode/seedBatch.js";
import { SeedCursor } from "./db/model/question.js";
import { withDbLimit } from "./db/dbLimiter.js";
import crypto from "crypto";

if (!process.env.ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN environment variable must be set");
}
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

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

function assertAdmin(req: FastifyRequest) {
  const token = getHeader(req, "x-admin-token");
  if (!ADMIN_TOKEN || !token || !safeCompare(token, ADMIN_TOKEN)) {
    throw new Error("Unauthorized");
  }
}

const leetcodeRoutes: FastifyPluginCallback = (app: FastifyInstance) => {
  app.get("/health", async (_req, reply) => {
    return reply.send({ ok: true });
  });

  app.post("/seed-batch", async (req) => {
    assertAdmin(req);
    const reset = (req.query as { reset?: string })?.reset === "1";
    if (reset) {
      await withDbLimit(() => SeedCursor.findByIdAndDelete("questions"));
    }

    const res = await seedLeetCodeBatch();
    return res;
  });
};

export default leetcodeRoutes;
