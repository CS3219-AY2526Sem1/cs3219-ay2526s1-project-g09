import validator from "validator";
import { ValidationError } from "./errors.js";

// Throws an error if validation fails
export function checkUsername(username) {
  if (typeof username !== "string" || username.length === 0) {
    throw new ValidationError("Username is required and must be a string");
  }
  // Username check
  if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    throw new ValidationError(
      "Username must be 3–20 characters and only contain letters, numbers",
    );
  }
  return username;
}

export function checkEmail(email) {
  if (!email || !validator.isEmail(email)) {
    throw new ValidationError("Email must be valid");
  }
  return validator.normalizeEmail(email); // sanitized
}

export function checkPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new ValidationError("Password is required");
  }
  if (password.length > 64) {
    throw new ValidationError("Password cannot exceed 64 characters");
  }
  if (/\s/.test(password)) {
    throw new ValidationError("Password must not contain spaces");
  }
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!"#$%&'()*+,\-./\\:;<=>?@[\]^_`{|}~]/.test(password)
  ) {
    throw new ValidationError(
      "Password must be at least 12 characters long and include uppercase, lowercase, number, and special character.",
    );
  }
  return password;
}

export function checkOTP(otp) {
  if (!otp || !validator.isNumeric(String(otp)) || String(otp).length !== 6) {
    throw new ValidationError("OTP must be a 6-digit number");
  }
  return String(otp);
}
