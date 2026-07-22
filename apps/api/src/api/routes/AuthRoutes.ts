import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { z } from "zod";
import { AuthService } from "@/api/services/AuthService";
import { loginRateLimiter } from "@/api/middleware/rateLimiters";
import { validate } from "@/api/middleware/validate";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict" as const,
  maxAge: 7 * 24 * 60 * 60,
};

const auth = new Hono()
  .post("/login", loginRateLimiter, validate("json", z.object({ password: z.string().min(1, "Password is required") })), async c => {
    const { password } = c.req.valid("json");
    const token = await AuthService.authenticate(password);
    setCookie(c, "token", token, COOKIE_OPTIONS);
    return c.body(null, 204);
  })
  .post("/logout", c => {
    deleteCookie(c, "token");
    return c.body(null, 204);
  })
  .get("/status", c => {
    const isAdmin = AuthService.verifyToken(getCookie(c, "token"));
    return c.json({ isAdmin });
  });

export default auth;
