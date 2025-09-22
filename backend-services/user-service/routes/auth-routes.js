import express from "express";

import {
  handleLogin,
  handleVerifyToken,
  generateAndSendOTP,
  verifyOTP,
} from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();

router.post("/login", rateLimiter, handleLogin);

router.get("/verify-token", rateLimiter, verifyAccessToken, handleVerifyToken);

router.post("/send-otp", rateLimiter, generateAndSendOTP);

router.post("/verify-otp", rateLimiter, verifyOTP);

export default router;
