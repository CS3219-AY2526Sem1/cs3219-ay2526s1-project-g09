import express from "express";
import {
  startSession,
  endSession,
  getSession,
  saveSnapshot,
} from "../controllers/collab.controller.js";

const router = express.Router();

router.post("/start", startSession); // called by Matching BE
router.post("/end", endSession); // push to Question History
router.put("/snapshot", saveSnapshot);
router.get("/:sessionId", getSession);

export default router;
