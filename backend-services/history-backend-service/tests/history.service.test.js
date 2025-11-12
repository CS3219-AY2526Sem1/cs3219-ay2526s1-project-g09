import { beforeEach, describe, expect, it, vi } from "vitest";

const createLeanResult = (value) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const createQueryChain = (items) => {
  const chain = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn().mockResolvedValue(items),
  };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
};

const sessionHistoryMock = {
  findOneAndUpdate: vi.fn(),
  findById: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn(),
  findByIdAndUpdate: vi.fn(),
};

vi.mock("../src/models/historyEntry.model.js", () => {
  return { default: sessionHistoryMock };
});

const { default: HistoryService } = await import(
  "../src/services/history.service.js"
);
const { default: SessionHistory } = await import(
  "../src/models/historyEntry.model.js"
);

describe("HistoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordSnapshot", () => {
    it("sanitises payload and upserts a history entry", async () => {
      const saved = { _id: "record-1" };
      SessionHistory.findOneAndUpdate.mockReturnValue(createLeanResult(saved));

      const result = await HistoryService.recordSnapshot({
        sessionId: "  session-123 ",
        userId: " user-1 ",
        participants: ["user-2", "user-1", "user-2"],
        codeSnapshot: "console.log('hi');",
        language: " TypeScript ",
        sessionEndedAt: "2024-11-25T00:00:00.000Z",
        sessionStartedAt: "2024-11-24T23:50:00.000Z",
        durationMs: 1234,
        metadata: { notes: "demo" },
        question: {
          questionId: "  q-1 ",
          title: " Two Sum ",
          topics: ["Arrays", " arrays "],
          difficulty: " Easy ",
        },
      });

      expect(result).toBe(saved);
      expect(SessionHistory.findOneAndUpdate).toHaveBeenCalledTimes(1);
      const [filter, update] = SessionHistory.findOneAndUpdate.mock.calls[0];
      expect(filter).toEqual({
        sessionId: "session-123",
        userId: "user-1",
      });
      expect(update.$set.participants).toEqual(["user-2", "user-1"]);
      expect(update.$set.language).toBe("typescript");
      expect(update.$set.durationMs).toBe(1234);
      expect(update.$set.metadata).toEqual({ notes: "demo" });
      expect(update.$set.question).toEqual(
        expect.objectContaining({
          questionId: "q-1",
          title: "Two Sum",
          difficulty: "Easy",
          topics: ["Arrays", "arrays"],
          timeLimit: undefined,
        }),
      );
      expect(update.$set.sessionEndedAt).toBeInstanceOf(Date);
      expect(update.$set.sessionStartedAt).toBeInstanceOf(Date);
    });

    it.each([
      [{}, /sessionId is required/],
      [
        { sessionId: "s1", userId: "u1", question: { questionId: "q" } },
        /code is required/,
      ],
      [
        { sessionId: "s1", code: "code", question: { questionId: "q" } },
        /userId is required/,
      ],
      [
        { sessionId: "s1", userId: "u1", code: "code" },
        /question information is required/,
      ],
    ])("throws validation error %#", async (payload, message) => {
      await expect(HistoryService.recordSnapshot(payload)).rejects.toThrow(
        message,
      );
    });
  });

  describe("listHistory", () => {
    it("applies sanitised filters and pagination defaults", async () => {
      const items = [{ _id: "doc-1" }];
      SessionHistory.find.mockReturnValue(createQueryChain(items));
      SessionHistory.countDocuments.mockResolvedValue(1);

      const result = await HistoryService.listHistory(
        {
          sessionId: " session-abc ",
          userId: " user-xyz ",
          questionId: " question-123 ",
        },
        {
          limit: 999,
          skip: -10,
          sort: { createdAt: 1 },
        },
      );

      expect(SessionHistory.find).toHaveBeenCalledWith({
        sessionId: "session-abc",
        userId: "user-xyz",
        "question.questionId": "question-123",
      });
      expect(result).toEqual({
        items,
        total: 1,
        limit: 100,
        skip: 0,
      });
    });
  });

  describe("updateSnapshot", () => {
    it("validates provided fields", async () => {
      await expect(
        HistoryService.updateSnapshot(null, {}),
      ).rejects.toMatchObject({
        message: "History id is required",
        status: 400,
      });
      await expect(
        HistoryService.updateSnapshot("id-1", { code: "" }),
      ).rejects.toMatchObject({
        message: "code must be a non-empty string",
        status: 400,
      });
      await expect(
        HistoryService.updateSnapshot("id-1", { language: "   " }),
      ).rejects.toMatchObject({
        message: "language must be a non-empty string",
        status: 400,
      });
      await expect(
        HistoryService.updateSnapshot("id-1", { sessionEndedAt: "invalid" }),
      ).rejects.toMatchObject({
        message: "sessionEndedAt must be a valid date",
        status: 400,
      });
      await expect(
        HistoryService.updateSnapshot("id-1", {}),
      ).rejects.toMatchObject({
        message: "No updatable fields provided",
        status: 400,
      });
    });

    it("updates snapshot and returns the updated document", async () => {
      const updated = { _id: "id-2", code: "updated code" };
      SessionHistory.findByIdAndUpdate.mockReturnValue(
        createLeanResult(updated),
      );

      const result = await HistoryService.updateSnapshot("id-2", {
        code: "updated code",
        language: " Python ",
        sessionEndedAt: null,
        durationMs: -5,
      });

      expect(result).toBe(updated);
      expect(SessionHistory.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      const [, update] = SessionHistory.findByIdAndUpdate.mock.calls[0];
      expect(update.$set).toMatchObject({
        code: "updated code",
        language: "python",
        sessionEndedAt: undefined,
        durationMs: 0,
      });
    });

    it("throws 404 when snapshot not found", async () => {
      SessionHistory.findByIdAndUpdate.mockReturnValue(createLeanResult(null));

      await expect(
        HistoryService.updateSnapshot("missing-id", { code: "value" }),
      ).rejects.toMatchObject({
        message: "History snapshot not found",
        status: 404,
      });
    });
  });
});
