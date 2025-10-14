import { setTimeout as delay } from "node:timers/promises";

type HealthOpts = {
  url?: string; // health check URL
  timeoutMs?: number; // per-attempt timeout
  retries?: number; // number of retries after the first attempt
};

interface HealthResponse {
  ok?: boolean;
}

export async function checkQuestionServiceHealth({
  url = `${process.env.QUESTION_API_URL}/health`,
  timeoutMs = 1500,
  retries = 2,
}: HealthOpts = {}) {
  if (!process.env.QUESTION_API_URL)
    throw new Error("QUESTION_API_URL is not set");

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(t);

      if (!res.ok) {
        lastErr = new Error(`Health endpoint returned ${res.status}`);
      } else {
        const body: HealthResponse = (await res.json()) as HealthResponse;
        if (body?.ok !== true) {
          lastErr = new Error("Health endpoint did not return ok=true");
        } else {
          return true;
        }
      }
    } catch (err) {
      lastErr = err;
    }

    if (attempt < retries) {
      await delay(250 * 2 ** attempt);
    }
  }

  throw new Error(
    `Question service health check failed: ${(lastErr as Error)?.message ?? lastErr}`,
  );
}
