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
  findUserByValidResetHash as _findUserByValidResetHash,
  setResetToken as _setResetToken,
  clearResetToken as _clearResetToken,
  updateUserPasswordAndInvalidateSessions as _updateUserPasswordAndInvalidateSessions,
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

    const tokenLifetime = rememberMe ? "30d" : "1d";

    const accessToken = generateAccessToken(user, tokenLifetime);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("authToken", accessToken, {
      httpOnly: true,
      secure: isProd, // HTTPS in prod
      sameSite: isProd ? "None" : "Lax", // None in prod, Lax in dev
      path: "/",
      ...(rememberMe ? { maxAge: 24 * 60 * 60 * 1000 } : {}), // 1 day
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

    const accessToken = await generateAccessToken(user, "1d"); // token expiry 1 day by default
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

export async function handleForgotPassword(req, res) {
  try {
    const { email: dirtyEmail } = req.body || {};
    // Always return 200 to avoid user enumeration
    if (!dirtyEmail) return res.status(200).json({ ok: true });

    const email = checkEmail(dirtyEmail);
    const user = await _findUserByEmail(email);

    // If user doesn't exist, still 200
    if (!user) return res.status(200).json({ ok: true });

    // Create secure single-use token (store only its hash)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await _setResetToken(user._id, resetTokenHash, expiresAt);

    const uiOrigin = process.env.UI_ORIGIN || "http://localhost:5173";
    const resetUrl = `${uiOrigin}/resetPassword?token=${rawToken}`;

    const subject = "Reset your PeerPrep password";
    const body = [
      "You requested a password reset.",
      `Click the link to reset your password: ${resetUrl}`,
      "This link expires in 30 minutes. If you didn’t request this, you can ignore this email.",
    ].join("\n\n");

    await _sendEmail(email, subject, body);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}

export async function handleResetPassword(req, res) {
  try {
    const { token: rawToken, newPassword: dirtyPassword } = req.body || {};
    if (!rawToken || !dirtyPassword) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const newPassword = checkPassword(dirtyPassword);

    // Hash provided token and find valid user
    const providedHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await _findUserByValidResetHash(providedHash);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password, set passwordChangedAt, and clear token fields
    await _updateUserPasswordAndInvalidateSessions(user._id, newPasswordHash);

    // Clear token
    await _clearResetToken(user._id);

    return res.status(200).json({ message: "Password has been reset." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to reset password" });
  }
}

export async function handleValidateResetToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await _findUserByValidResetHash(tokenHash);

  // If user found and token not expired => valid
  const isUserFound = !!user;
  return res.json({ valid: isUserFound });
}

function generateAccessToken(user, expiresIn) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
}
