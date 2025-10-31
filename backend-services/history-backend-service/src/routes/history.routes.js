import { Router } from "express";
import {
  createHistorySnapshot,
  getHistorySnapshot,
  healthCheck,
  listHistorySnapshots,
  updateHistorySnapshot,
} from "../controllers/history.controller.js";

const router = Router();

router.get("/health", healthCheck);
router.get("/history", listHistorySnapshots);
router.get("/history/:id", getHistorySnapshot);
router.post("/history", createHistorySnapshot);
router.patch("/history/:id", updateHistorySnapshot);

export default router;
