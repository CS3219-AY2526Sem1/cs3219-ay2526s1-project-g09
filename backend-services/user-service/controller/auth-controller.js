import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import {
  findUserByEmail as _findUserByEmail,
  findOTPByEmail as _findOTPByEmail,
  deleteOTPByEmail as _deleteOTPByEmail,
  createOTPForEmail as _createOTPForEmail,
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
  const { email: dirtyEmail, password: dirtyPassword } = req.body;
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

    const accessToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    return res.status(200).json({
      message: "User logged in",
      data: { accessToken, ...formatUserResponse(user) },
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

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function verifyOTP(req, res) {
  try {
    const { email: dirtyEmail, otp: dirtyOtp } = req.body;

    const email = checkEmail(dirtyEmail);
    const otp = checkOTP(dirtyOtp);

    // Check if OTP matches
    const otpRecord = await _findOTPByEmail(email);
    if (
      !crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(otpRecord.code))
    ) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    // Delete used OTP
    await _deleteOTPByEmail(email);

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
