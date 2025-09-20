import validator from "validator";

export function isUsername(req, res, next) {
  const username = req.body.username;
  if (typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ message: "Username is required and must be a string" });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
  }
  req.body.username = username.trim();
  next();
}

export function isEmail(req, res, next) {
  const email = req.body.email;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: "Email must be valid" });
  }
  req.body.email = validator.normalizeEmail(email);
  next();
}

export function isPassword(req, res, next) {
  const password = req.body.password;
  if (typeof password !== "string" || !password.trim()) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  req.body.password = password.trim();
  next();
}

export function isOTP(req, res, next) {
  const otp = req.body.otp;
  if (!otp || !validator.isNumeric(String(otp)) || otp.length !== 6) {
    return res.status(400).json({ message: "OTP must be a 6-digit number" });
  }
  next();
}