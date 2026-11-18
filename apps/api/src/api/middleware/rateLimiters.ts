import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  maxAttempts: number;
  windowMS: number;
  now?: () => number;
  attempts?: Map<string, RateLimitEntry>;
}

/**
 * Builds middleware that lets each visitor make `maxAttempts` requests per window, then answers 429.
 * A visitor is the IP address Cloudflare sends in `CF-Connecting-IP`. Cloudflare replaces any value
 * the client sends, and the server refuses requests that don't come through Cloudflare, so the client
 * can't choose its own key. Without the header, as in local dev, every request shares one limit.
 * Each call removes expired entries, so the map only holds visitors inside their window.
 */
export function createRateLimiter({ maxAttempts, windowMS, now = Date.now, attempts = new Map() }: RateLimiterOptions) {
  return createMiddleware(async (c, next) => {
    const time = now();
    for (const [key, entry] of attempts) {
      if (time > entry.resetAt) attempts.delete(key);
    }

    const key = c.req.header("cf-connecting-ip") ?? "unknown";
    const entry = attempts.get(key);
    if (!entry) {
      attempts.set(key, { count: 1, resetAt: time + windowMS });
    } else if (entry.count >= maxAttempts) {
      throw new HTTPException(429, { message: "Too many login attempts, please try again later" });
    } else {
      attempts.set(key, { ...entry, count: entry.count + 1 });
    }
    await next();
  });
}

const passThrough = createMiddleware(async (_c, next) => {
  await next();
});

// The API tests log in many times from one client, so the limit is off for them
export const loginRateLimiter = process.env.NODE_ENV === "test" ? passThrough : createRateLimiter({ maxAttempts: 5, windowMS: 15 * 60 * 1000 });
