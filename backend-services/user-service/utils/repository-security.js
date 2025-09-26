import validator from "validator";
import { ValidationError } from "./errors.js";
import { passwordStrength } from "check-password-strength";

//password strength check variables
const options = [
  {
    id: 0,
    value: "Too weak",
    minDiversity: 0,
    minLength: 0,
  },
  {
    id: 1,
    value: "Weak",
    minDiversity: 2,
    minLength: 8,
  },
  {
    id: 2,
    value: "Medium",
    minDiversity: 4,
    minLength: 10,
  },
  {
    id: 3,
    value: "Strong",
    minDiversity: 4,
    minLength: 12,
  },
];
const strongestOption = options[options.length - 1];
const owaspSymbols = "!\"#$%&'()*+,-./\\:;<=>?@[]^_`{|}~"; //Special characters in password (Specified by OWASP)

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
    throw new ValidationError("Password is longer than 64 characters");
  }
  if (password.indexOf(" ") >= 0) {
    throw new ValidationError("Password should not have any Whitespace");
  }
  if (checkPasswordStrength(password) !== strongestOption.value) {
    throw new ValidationError(
      "Password is not strong enough. It must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    );
  }
  return password;
}

function checkPasswordStrength(password) {
  return passwordStrength(password, options, owaspSymbols).value;
}

export function checkOTP(otp) {
  if (!otp || !validator.isNumeric(String(otp)) || String(otp).length !== 6) {
    throw new ValidationError("OTP must be a 6-digit number");
  }
  return String(otp);
}
