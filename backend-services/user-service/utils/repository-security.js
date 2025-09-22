import validator from "validator";
import { ValidationError } from "./errors.js";

// Throws an error if validation fails
export function checkUsername(username) {
  if (typeof username !== "string" || !username.trim()) {
    throw new ValidationError("Username is required and must be a string");
  }
  return username.trim();
}

export function checkEmail(email) {
  if (!email || !validator.isEmail(email)) {
    throw new ValidationError("Email must be valid");
  }
  return validator.normalizeEmail(email); // sanitized
}

export function checkPassword(password) {
  if (typeof password !== "string" || !password.trim()) {
    throw new ValidationError("Password is required");
  }
  return password.trim();
}

export function checkOTP(otp) {
  if (!otp || !validator.isNumeric(String(otp)) || otp.length !== 6) {
    throw new ValidationError("OTP must be a 6-digit number");
  }
  return otp;
}
