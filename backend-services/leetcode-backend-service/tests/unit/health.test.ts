import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkQuestionServiceHealth } from "../../src/health";

const realFetch = global.fetch;
const BACKOFF_MS = 250;

function makeFetchThatAbortsThen(
  abortTimes: number, // how many calls should "abort" first
  { ok = true, status = 200, json = async () => ({ ok: true }) } = {},
) {
  let callCount = 0;

  const makeResponse = () => ({ ok, status, json });

  return vi.fn((_url, init) => {
    const signal: AbortSignal = init?.signal;

    return new Promise((resolve, reject) => {
      const rejectDeferred = () =>
        queueMicrotask(() => reject(new DOMException("Aborted", "AbortError")));

      // If already aborted before starting, reject immediately.
      if (signal?.aborted) {
        rejectDeferred();
        return;
      }

      callCount += 1;

      // First N calls: wait for abort, then reject.
      if (callCount <= abortTimes) {
        signal?.addEventListener("abort", rejectDeferred, { once: true });
        return; // leave the promise hanging
      }

      // After N aborts: resolve like a normal fetch response.
      queueMicrotask(() => resolve(makeResponse()));
    });
  });
}

// If you already have this in a helper file, import it instead.
const makeAbortingFetchMock = () =>
  vi.fn((_url: string, init: any) => {
    const signal: AbortSignal = init?.signal;
    return new Promise((_resolve, reject) => {
      const rejectDeferred = () =>
        queueMicrotask(() => reject(new DOMException("Aborted", "AbortError")));

      if (signal?.aborted) {
        rejectDeferred();
        return;
      }
      signal?.addEventListener("abort", rejectDeferred, { once: true });
    });
  });

describe("checkQuestionServiceHealth (unit)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("throws if QUESTION_API_URL is missing", async () => {
    const old = process.env.QUESTION_API_URL;
    delete process.env.QUESTION_API_URL;
    await expect(checkQuestionServiceHealth()).rejects.toThrow(
      "QUESTION_API_URL is not set",
    );
    process.env.QUESTION_API_URL = old;
  });

  it("returns true on ok:true", async () => {
    process.env.QUESTION_API_URL = "http://any";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );
    await expect(checkQuestionServiceHealth()).resolves.toBe(true);
  });

  it("retries once after an AbortError, then succeeds", async () => {
    // First attempt: AbortError; Second attempt: 200/ok
    const fetchMock = makeFetchThatAbortsThen(1, {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const p = checkQuestionServiceHealth({ timeoutMs: 100, retries: 1 });

    // Attempt 1 aborts at 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Flush microtasks to surface the AbortError into your catch
    await vi.runAllTicks();

    // Backoff before attempt 2
    await vi.advanceTimersByTimeAsync(BACKOFF_MS);

    // No need to advance timers further; our mock resolves on next microtask
    await vi.runAllTicks();

    await expect(p).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on network error with exponential backoff", async () => {
    process.env.QUESTION_API_URL = "http://any";

    const fetchMock = vi
      .fn()
      // attempt 1: network error
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      // attempt 2: returns ok:true
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const p = checkQuestionServiceHealth({ retries: 2, timeoutMs: 1500 });

    // after first failure, it should wait BASE_DELAY_MS (250ms)
    await vi.runOnlyPendingTimersAsync(); // advance timers (250ms)
    await expect(p).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // it("aborts a slow attempt and eventually throws", async () => {
  //   process.env.QUESTION_API_URL = "http://any";
  //   const fetchMock = makeAbortingFetchMock();
  //   vi.stubGlobal("fetch", fetchMock);

  //   const p = checkQuestionServiceHealth({
  //     retries: 1, // total attempts = 2
  //     timeoutMs: 100, // abort each attempt after 100ms
  //   });

  //   // Attempt 1: timeout -> abort at 100ms
  //   await vi.advanceTimersByTimeAsync(100);
  //   vi.runAllTicks();
  //   // Flush the deferred AbortError to surface the rejection and enter retry path
  //   await Promise.resolve();
  //   vi.runAllTicks();

  //   // Backoff after attempt 1: BASE_DELAY_MS * 2^0 = 250ms
  //   await vi.advanceTimersByTimeAsync(250);
  //   vi.runAllTicks();

  //   // Attempt 2: timeout -> abort at 100ms
  //   await vi.advanceTimersByTimeAsync(100);
  //   vi.runAllTicks();
  //   await Promise.resolve(); // flush deferred rejection

  //   await expect(p).rejects.toThrow(/health check failed/i);
  //   expect(fetchMock).toHaveBeenCalledTimes(2);
  // }, 10000);

  it("fails on non-2xx", async () => {
    process.env.QUESTION_API_URL = "http://any";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Response("nope", { status: 500 })),
    );
    await expect(checkQuestionServiceHealth({ retries: 0 })).rejects.toThrow(
      /returned 500/,
    );
  });

  it("fails if JSON does not contain ok:true", async () => {
    process.env.QUESTION_API_URL = "http://any";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Response(JSON.stringify({ ok: false }), { status: 200 })),
    );
    await expect(checkQuestionServiceHealth({ retries: 0 })).rejects.toThrow(
      /did not return ok=true/,
    );
  });
});
