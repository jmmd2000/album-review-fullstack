import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { AuthService } from "@/api/services/AuthService";

/**
 * Guards admin-only routes. Reads the JWT from the `token`
 * cookie and rejects with a 401 if it is missing or invalid.
 */
export const requireAdmin = createMiddleware(async (c, next) => {
  const token = getCookie(c, "token");
  if (!AuthService.verifyToken(token)) {
    throw new HTTPException(401, { message: "Unauthorised" });
  }
  await next();
});

/** Tells whether the request comes from the logged-in admin, for routes that show the admin more. */
export function isAdminRequest(c: Context): boolean {
  return AuthService.verifyToken(getCookie(c, "token"));
}
