import HistoryService from "../services/history.service.js";

export const healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export const createHistorySnapshot = async (req, res) => {
  try {
    console.log("[history.controller] POST /history payload", req.body);
    const snapshot = await HistoryService.recordSnapshot(req.body ?? {});
    res.status(201).json({ success: true, snapshot });
  } catch (error) {
    console.error("[history.controller] Failed to record snapshot", error);
    res.status(400).json({
      success: false,
      error: error.message ?? "Failed to record history snapshot",
    });
  }
};

export const updateHistorySnapshot = async (req, res) => {
  try {
    const { id } = req.params ?? {};
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "History id is required" });
    }

    console.log("[history.controller] PATCH /history/:id", id, req.body);
    const snapshot = await HistoryService.updateSnapshot(id, req.body ?? {});
    res.json({ success: true, snapshot });
  } catch (error) {
    const status =
      error.status && Number.isInteger(error.status) ? error.status : 500;
    console.error("[history.controller] Failed to update snapshot", error);
    res.status(status).json({
      success: false,
      error: error.message ?? "Failed to update history snapshot",
    });
  }
};

export const listHistorySnapshots = async (req, res) => {
  try {
    console.log("[history.controller] GET /history query", req.query);
    const result = await HistoryService.listHistory(req.query ?? {});
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("[history.controller] Failed to list snapshots", error);
    res.status(500).json({
      success: false,
      error: error.message ?? "Failed to retrieve history snapshots",
    });
  }
};

export const getHistorySnapshot = async (req, res) => {
  try {
    const { id } = req.params ?? {};
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "History id is required" });
    }

    console.log("[history.controller] GET /history/:id", id);
    const snapshot = await HistoryService.getHistoryById(id);

    if (!snapshot) {
      return res
        .status(404)
        .json({ success: false, error: "History snapshot not found" });
    }

    res.json({ success: true, snapshot });
  } catch (error) {
    console.error("[history.controller] Failed to get snapshot", error);
    res.status(500).json({
      success: false,
      error: error.message ?? "Failed to retrieve history snapshot",
    });
  }
};
