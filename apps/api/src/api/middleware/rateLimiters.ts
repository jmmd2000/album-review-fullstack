import rateLimit from "express-rate-limit";

// Limit login attempts per IP so the single admin password cannot be brute forced.
// Skipped in tests, where many logins hit this from one address in a single process.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { message: "Too many login attempts. Please try again later." },
});
