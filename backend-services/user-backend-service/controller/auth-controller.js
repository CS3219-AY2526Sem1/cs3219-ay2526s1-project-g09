import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import {
  findUserByEmail as _findUserByEmail,
  findOTPByEmail as _findOTPByEmail,
  deleteOTPByEmail as _deleteOTPByEmail,
  createOTPForEmail as _createOTPForEmail,
  updateVerificationById as _updateVerificationById,
  updateUserExpirationById as _updateUserExpirationById,
} from "../model/repository.js";
import { formatUserResponse } from "./user-controller.js";
import { sendEmail as _sendEmail } from "../utils/email-sender.js";
import {
  checkEmail,
  checkPassword,
  checkOTP,
} from "../utils/repository-security.js";
import { ValidationError } from "../utils/errors.js";

export async function handleLogin(req, res) {
  const { email: dirtyEmail, password: dirtyPassword, rememberMe } = req.body;
  try {
    if (!dirtyEmail || !dirtyPassword) {
      return res.status(400).json({ message: "Missing email and/or password" });
    }
    const email = checkEmail(dirtyEmail);
    const password = checkPassword(dirtyPassword);

    const user = await _findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Wrong email and/or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Wrong email and/or password" });
    }

    // If user is not verified
    if (!user.isVerified) {
      await generateOTPforEmail(email);
      // give temp access to otp page

      return res.status(200).json({
        message: "User not verified. OTP sent to email.",
        data: formatUserResponse(user),
      });
    }

    const accessToken = await generateToken(user);

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("authToken", accessToken, {
      httpOnly: true,
      secure: isProd, // HTTPS in prod
      sameSite: isProd ? "None" : "Lax", // None in prod, Lax in dev
      path: "/",
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}), // 7 days
    });

    return res.status(200).json({
      message: "User logged in",
      data: formatUserResponse(user),
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(err);
      return res.status(400).json({ message: err.message });
    }
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
}

async function generateToken(user) {
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  return accessToken;
}

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res
      .status(200)
      .json({ message: "Token verified", data: verifiedUser });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function generateAndSendOTP(req, res) {
  try {
    const { email: dirtyEmail } = req.body;

    const email = checkEmail(dirtyEmail);

    await generateOTPforEmail(email);

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function generateOTPforEmail(email) {
  // Delete any existing OTP in DB
  await _deleteOTPByEmail(email);

  // Generate 6-digit OTP
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  // Save OTP in DB
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await _createOTPForEmail(email, otp, expiresAt);

  // Send OTP
  const subject = "Verify Your PeerPrep Email Address";
  const body = "Your OTP is: " + otp;
  await _sendEmail(email, subject, body);
}

export async function verifyOTP(req, res) {
  try {
    const { email: dirtyEmail, otp: dirtyOtp } = req.body;

    const email = checkEmail(dirtyEmail);
    const otp = checkOTP(dirtyOtp);

    // Check if OTP matches
    const otpRecord = await _findOTPByEmail(email);
    if (
      !otpRecord ||
      !otpRecord.code ||
      !crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(otpRecord.code))
    ) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    // Delete used OTP
    await _deleteOTPByEmail(email);

    // Get userId for email
    const user = await _findUserByEmail(email);

    // Update verification status
    const updatedUser = await _updateVerificationById(user._id, true);
    await _updateUserExpirationById(user._id, null);

    const accessToken = await generateToken(user);
    const isProd = process.env.NODE_ENV === "production";

    // give user a cookie
    res.cookie("authToken", accessToken, {
      httpOnly: true,
      secure: isProd, // HTTPS in prod
      sameSite: isProd ? "None" : "Lax", // None in prod, Lax in dev
      path: "/",
    });

    return res.status(200).json({
      message: "Email verified successfully",
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleLogout(req, res) {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out" });
}
