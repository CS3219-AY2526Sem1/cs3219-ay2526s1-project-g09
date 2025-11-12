import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createHistorySnapshot,
  getHistorySnapshot,
  healthCheck,
  listHistorySnapshots,
  updateHistorySnapshot,
} from "../src/controllers/history.controller.js";

const serviceMocks = vi.hoisted(() => ({
  recordSnapshot: vi.fn(),
  listHistory: vi.fn(),
  getHistoryById: vi.fn(),
  updateSnapshot: vi.fn(),
}));

vi.mock("../src/services/history.service.js", () => ({
  default: serviceMocks,
}));

const createRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("history controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("healthCheck returns ok payload", async () => {
    const res = createRes();
    await healthCheck({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      }),
    );
  });

  describe("createHistorySnapshot", () => {
    it("persists snapshot", async () => {
      const snapshot = { _id: "id-1" };
      serviceMocks.recordSnapshot.mockResolvedValueOnce(snapshot);
      const req = { body: { sessionId: "s1" } };
      const res = createRes();

      await createHistorySnapshot(req, res);

      expect(serviceMocks.recordSnapshot).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, snapshot });
    });

    it("handles validation error", async () => {
      serviceMocks.recordSnapshot.mockRejectedValueOnce(new Error("invalid"));
      const req = { body: {} };
      const res = createRes();

      await createHistorySnapshot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "invalid",
      });
    });
  });

  describe("listHistorySnapshots", () => {
    it("returns list payload", async () => {
      const result = { items: [], total: 0, limit: 20, skip: 0 };
      serviceMocks.listHistory.mockResolvedValueOnce(result);
      const req = { query: { sessionId: "s1" } };
      const res = createRes();

      await listHistorySnapshots(req, res);

      expect(serviceMocks.listHistory).toHaveBeenCalledWith(req.query ?? {});
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it("handles unexpected error", async () => {
      serviceMocks.listHistory.mockRejectedValueOnce(new Error("oops"));
      const res = createRes();

      await listHistorySnapshots({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "oops",
      });
    });
  });

  describe("getHistorySnapshot", () => {
    it("returns 200 when snapshot exists", async () => {
      serviceMocks.getHistoryById.mockResolvedValueOnce({ _id: "doc1" });
      const req = { params: { id: "doc1" } };
      const res = createRes();

      await getHistorySnapshot(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        snapshot: { _id: "doc1" },
      });
    });

    it("returns 404 when missing", async () => {
      serviceMocks.getHistoryById.mockResolvedValueOnce(null);
      const req = { params: { id: "missing" } };
      const res = createRes();

      await getHistorySnapshot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "History snapshot not found",
      });
    });
  });

  describe("updateHistorySnapshot", () => {
    it("updates snapshot", async () => {
      const updated = { _id: "doc1", code: "new" };
      serviceMocks.updateSnapshot.mockResolvedValueOnce(updated);
      const req = { params: { id: "doc1" }, body: { code: "new" } };
      const res = createRes();

      await updateHistorySnapshot(req, res);

      expect(serviceMocks.updateSnapshot).toHaveBeenCalledWith(
        "doc1",
        req.body,
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        snapshot: updated,
      });
    });

    it("propagates service error status", async () => {
      const error = new Error("not found");
      error.status = 404;
      serviceMocks.updateSnapshot.mockRejectedValueOnce(error);
      const req = { params: { id: "doc1" }, body: { code: "new" } };
      const res = createRes();

      await updateHistorySnapshot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "not found",
      });
    });
  });
});
