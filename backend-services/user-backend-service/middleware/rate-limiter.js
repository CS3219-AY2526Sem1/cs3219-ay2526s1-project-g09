import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute
  max: 100, // Max: 100 request
  message: {
    message: "Too many requests, please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
