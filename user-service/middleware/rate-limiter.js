import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,                 // Max: 10 request
  message: {
    message: "Too many requests, please try again later.",
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers
});