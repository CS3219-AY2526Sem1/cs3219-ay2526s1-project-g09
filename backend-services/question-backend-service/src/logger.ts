type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, data?: unknown) {
  const ts = new Date().toISOString();
  console[level](`[${ts}] [${level.toUpperCase()}] ${message}`, data ?? "");
}

export const logger = {
  info: (msg: string, data?: unknown) => log("info", msg, data),
  warn: (msg: string, data?: unknown) => log("warn", msg, data),
  error: (msg: string, data?: unknown) => log("error", msg, data),
};
