import { setTimeout as delay } from "node:timers/promises";

type HealthOpts = {
  url?: string; // health check URL
  timeoutMs?: number; // per-attempt timeout
  retries?: number; // number of retries after the first attempt
};

interface HealthResponse {
  ok?: boolean;
}

const BATCH_HEALTH_TIMEOUT_MS = 1500;
const BATCH_HEALTH_RETRIES = 2;
const BASE_DELAY_MS = 250;

/** Check the health of the question service.
 * Throws an error if the service is unhealthy or unreachable after retries.
 * @param opts - Options for health check.
 * @returns A promise that resolves to true if healthy, otherwise throws an error.
 */

export async function checkQuestionServiceHealth({
  url = `${process.env.QUESTION_API_URL}/health`,
  timeoutMs = BATCH_HEALTH_TIMEOUT_MS,
  retries = BATCH_HEALTH_RETRIES,
}: HealthOpts = {}) {
  if (!process.env.QUESTION_API_URL)
    throw new Error("QUESTION_API_URL is not set");

  let lastErr: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
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
      await delay(BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw new Error(`Question service health check failed: ${String(lastErr)}`);
}
