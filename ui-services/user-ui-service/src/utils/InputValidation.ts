export function validateUsername(username: string): string | null {
  if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return "Username must be 3–20 characters and only contain letters and numbers.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Email must be valid.";
  }
  return null;
}

export function normalizeEmail(email: string): string {
  if (!email) return email;

  const [localPart, domain = ""] = email.split("@");
  return `${localPart}@${domain.toLowerCase()}`;
}

export function validatePassword(password: string): string {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required.");
    return errors.join("\n");
  }
  if (password.length > 64) {
    errors.push("Password cannot exceed 64 characters.");
  }
  if (/\s/.test(password)) {
    errors.push("Password must not contain spaces.");
  }
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number.");
  }
  if (!/[!"#$%&'()*+,\-./\\:;<=>?@[\]^_`{|}~]/.test(password)) {
    errors.push("Password must include at least one special character.");
  }

  return errors.join("\n");
}

export function validateOtp(otp: string): string | null {
  if (!/^\d{6}$/.test(otp)) {
    return "OTP must be a 6-digit number.";
  }
  return null;
}
