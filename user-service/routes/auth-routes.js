import express from "express";

import { handleLogin, handleVerifyToken, generateAndSendOTP, verifyOTP } from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";
import { isUsername, isEmail, isPassword, isOTP } from "../middleware/repository-security.js";

const router = express.Router();

router.post("/login", isUsername, isEmail, isPassword, handleLogin);

router.get("/verify-token", verifyAccessToken, handleVerifyToken);

router.post("/send-otp", isEmail, generateAndSendOTP);

router.post("/verify-otp", isEmail, isOTP, verifyOTP);

export default router;
