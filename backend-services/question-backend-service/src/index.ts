import Fastify from "fastify";
import cors from "@fastify/cors";
import { gql, QUERY_LIST, QUERY_DETAIL } from "./leetcode.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: "*" });

app.get("/api/v1/healthz", async () => ({ ok: true, service: "question-backend-service" }));

// LeetCode “ping” route (no DB) — super small
app.get("/api/v1/leetcode-test", async () => {
  // 1) first 5 problems
  const list = await gql<{
    problemsetQuestionList: {
      total: number,
      questions: { title: string; titleSlug: string; difficulty: string }[]
    }
  }>(QUERY_LIST, { categorySlug: "", limit: 5, skip: 0, filters: {} });

  const slugs = list.problemsetQuestionList.questions.map(q => q.titleSlug);
  const firstSlug = slugs[0];

  // 2) details for the first slug
  const detail = await gql<{ question: { title: string; codeSnippets: any[] } }>(
    QUERY_DETAIL, { titleSlug: firstSlug }
  );

  return {
    ok: true,
    totalKnown: list.problemsetQuestionList.total,
    firstPageSlugs: slugs,
    firstTitle: detail.question?.title ?? null,
    firstSnippetCount: detail.question?.codeSnippets?.length ?? 0
  };
});

const PORT = Number(process.env.PORT ?? 5275);
await app.listen({ port: PORT, host: "0.0.0.0" });
