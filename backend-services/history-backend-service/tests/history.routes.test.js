import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
const recordSnapshot = vi.fn();
const listHistory = vi.fn();
const getHistoryById = vi.fn();
const updateSnapshot = vi.fn();
vi.mock("../src/config/db.js", () => ({
  connectDB: vi.fn(),
}));
vi.mock("../src/services/history.service.js", () => ({
  default: {
    recordSnapshot,
    listHistory,
    getHistoryById,
    updateSnapshot,
  },
}));
const { default: app } = await import("../src/app.js");
describe("history routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("reports service health", async () => {
    const response = await request(app).get("/api/v1/history-service/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
  describe("POST /history", () => {
    it("persists snapshot payload", async () => {
      const snapshot = { _id: "1" };
      recordSnapshot.mockResolvedValueOnce(snapshot);
      const payload = {
        sessionId: "s1",
        userId: "u1",
        code: "code",
        question: { questionId: "q1" },
      };
      const response = await request(app)
        .post("/api/v1/history-service/history")
        .send(payload);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, snapshot });
      expect(recordSnapshot).toHaveBeenCalledWith(payload);
    });
    it("handles validation errors", async () => {
      recordSnapshot.mockRejectedValueOnce(new Error("invalid"));
      const response = await request(app)
        .post("/api/v1/history-service/history")
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: "invalid",
      });
    });
  });
  describe("GET /history", () => {
    it("returns paginated history list", async () => {
      const result = { items: [], total: 0, limit: 20, skip: 0 };
      listHistory.mockResolvedValueOnce(result);
      const response = await request(app)
        .get("/api/v1/history-service/history")
        .query({ sessionId: "s1" });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, ...result });
      expect(listHistory).toHaveBeenCalledWith({ sessionId: "s1" });
    });
  });
  describe("GET /history/:id", () => {
    it("returns a snapshot when found", async () => {
      const snapshot = { _id: "doc1" };
      getHistoryById.mockResolvedValueOnce(snapshot);
      const response = await request(app).get(
        "/api/v1/history-service/history/doc1",
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, snapshot });
    });
    it("returns 404 when snapshot missing", async () => {
      getHistoryById.mockResolvedValueOnce(null);
      const response = await request(app).get(
        "/api/v1/history-service/history/missing",
      );
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "History snapshot not found",
      });
    });
  });
  describe("PATCH /history/:id", () => {
    it("updates and returns snapshot", async () => {
      const updated = { _id: "doc1", code: "new" };
      updateSnapshot.mockResolvedValueOnce(updated);
      const response = await request(app)
        .patch("/api/v1/history-service/history/doc1")
        .send({ code: "new" });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, snapshot: updated });
      expect(updateSnapshot).toHaveBeenCalledWith("doc1", { code: "new" });
    });
    it("propagates service errors with status", async () => {
      const error = new Error("boom");
      error.status = 404;
      updateSnapshot.mockRejectedValueOnce(error);
      const response = await request(app)
        .patch("/api/v1/history-service/history/doc1")
        .send({ code: "new" });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "boom",
      });
    });
  });
});
