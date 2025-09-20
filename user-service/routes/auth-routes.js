import express from "express";

import { handleLogin, handleVerifyToken, generateAndSendOTP, verifyOTP } from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";
import { isUsername, isEmail, isPassword, isOTP } from "../middleware/repository-security.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();

router.post("/login", rateLimiter, isUsername, isEmail, isPassword, handleLogin);

router.get("/verify-token", rateLimiter, verifyAccessToken, handleVerifyToken);

router.post("/send-otp", rateLimiter, isEmail, generateAndSendOTP);

router.post("/verify-otp", rateLimiter, isEmail, isOTP, verifyOTP);

export default router;
