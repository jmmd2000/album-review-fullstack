import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

// 5 login attempts per client per 15 minutes
export const loginRateLimiter = createMiddleware(async (c, next) => {
  if (process.env.NODE_ENV !== "test") {
    const key = c.req.header("x-forwarded-for") ?? "unknown";
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now > entry.resetAt) {
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (entry.count >= MAX_ATTEMPTS) {
      throw new HTTPException(429, { message: "Too many login attempts, please try again later" });
    } else {
      entry.count += 1;
    }
  }
  await next();
});
