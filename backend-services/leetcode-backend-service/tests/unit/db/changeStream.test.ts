import { afterEach } from "node:test";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("mongoose", () => {
  const onHandlers: Record<string, Function> = {};
  return {
    default: {
      connection: {
        readyState: 0,
        once: (event: string, cb: Function) => (onHandlers[event] = cb),
      },
      ConnectionStates: { connected: 1 },
      mongo: {
        ChangeStream: class {},
      },
    },
  };
});

vi.mock("axios", () => ({
  default: { post: vi.fn(async () => ({ data: { ok: true } })) },
}));

vi.mock("../../../src/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("../../../src/model/question.js", () => ({
  Question: {
    watch: vi.fn(() => {
      const listeners: any = {};
      return {
        on: (event: string, handler: any) => {
          listeners[event] = handler;
        },
        emit: (event: string, payload: any) => {
          if (listeners[event]) listeners[event](payload);
        },
        close: vi.fn(),
      };
    }),
  },
}));

const { default: changeStreamPlugin } = await import(
  "../../../src/db/changeStream"
);

describe("ChangeStream Plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // reset mongoose connection state
    const mongoose = require("mongoose").default;
    mongoose.connection.readyState = 0;
  });

  it("starts watcher and processes valid change events", async () => {
    const fakeApp = { addHook: vi.fn() };
    const { Question } = await import("../../../src/db/model/question.js");
    const watchMock = Question.watch as unknown as ReturnType<typeof vi.fn>;
    const mockStream = watchMock.mock.results[0]!.value;

    changeStreamPlugin(fakeApp as any);

    // Simulate a MongoDB "change" event
    mockStream.emit("change", {
      operationType: "insert",
      fullDocument: { title: "test", content: "abc" },
    });

    // Wait microtasks to flush queue
    await new Promise((r) => setTimeout(r, 10));

    const axios = (await import("axios")).default;
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/post-question/),
      expect.objectContaining({ title: "test" }),
      expect.anything(),
    );
  });
  it("closes stream on Fastify onClose", async () => {
    interface FakeApp {
      addHook: ReturnType<typeof vi.fn>;
      _hook?: () => Promise<void>;
    }

    const fakeApp: FakeApp = {
      addHook: vi.fn((name, fn) => {
        (fakeApp as FakeApp)._hook = fn;
      }),
    };

    const { Question } = await import("../../../src/db/model/question.js");
    const watchMock = Question.watch as unknown as ReturnType<typeof vi.fn>;
    const mockStream = watchMock.mock.results[0]!.value;

    changeStreamPlugin(fakeApp as any);

    // trigger onClose
    await fakeApp._hook!();
    expect(mockStream.close).toHaveBeenCalled();
  });
});
