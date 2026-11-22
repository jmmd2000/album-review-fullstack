import { createHash, timingSafeEqual } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { env } from "@/config/env";

const BEARER_PREFIX = "Bearer ";

/** Hashes both tokens first, so they have the same length and the compare takes the same time for any token. */
function tokensMatch(given: string, expected: string): boolean {
  const givenHash = createHash("sha256").update(given).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(givenHash, expectedHash);
}

/**
 * Guards the daily listening summary. The request needs `Authorization: Bearer <SUMMARY_TOKEN>`. A missing or wrong
 * token gets a 401, and so does every request when SUMMARY_TOKEN isn't set.
 */
export const requireSummaryToken = createMiddleware(async (c, next) => {
  const expected = env.SUMMARY_TOKEN;
  const header = c.req.header("authorization") ?? "";
  const given = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : "";
  if (!expected || !given || !tokensMatch(given, expected)) {
    throw new HTTPException(401, { message: "Unauthorised" });
  }
  await next();
});
