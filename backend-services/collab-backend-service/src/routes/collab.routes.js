import express from "express";
import {
  startSession,
  disconnectSession,
  getSession,
  getActiveSessionForUser,
  connectSession,
  healthCheck,
  readinessCheck,
} from "../controllers/collab.controller.js";

const router = express.Router();

router.get("/health", healthCheck); // called by load balancers to see if service is ok.
router.get("/health/ready", readinessCheck); // readiness check to see if dependencies are up.
router.post("/start", startSession); // called by Matching BE -> creates new session
router.post("/connect/:userId", connectSession); // called by FE when user connects/reconnects
router.post("/disconnect/:userId", disconnectSession); // push to Question History
router.get("/sessions/:userId", getActiveSessionForUser); // called by FE to get active session for user
router.get("/:sessionId", getSession); // called by timer FE to get session details

export default router;
