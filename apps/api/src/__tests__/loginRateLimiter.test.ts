import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { test, expect } from "vitest";
import { createRateLimiter } from "@/api/middleware/rateLimiters";

const WINDOW_MS = 15 * 60 * 1000;

function limitedApp(clock: { time: number }, attempts = new Map()) {
  const app = new Hono();
  app.use(createRateLimiter({ maxAttempts: 5, windowMS: WINDOW_MS, now: () => clock.time, attempts }));
  app.post("/login", c => c.body(null, 204));
  app.onError((error, c) => (error instanceof HTTPException ? c.body(null, error.status) : c.body(null, 500)));
  return app;
}

const attempt = (app: Hono, headers: Record<string, string>) => app.request("/login", { method: "POST", headers });

test("a forged X-Forwarded-For doesn't get a visitor a fresh limit", async () => {
  const app = limitedApp({ time: 0 });

  for (let index = 0; index < 5; index++) {
    expect((await attempt(app, { "CF-Connecting-IP": "203.0.113.7", "X-Forwarded-For": `198.51.100.${index}` })).status).toBe(204);
  }
  const sixth = await attempt(app, { "CF-Connecting-IP": "203.0.113.7", "X-Forwarded-For": "198.51.100.99" });
  expect(sixth.status).toBe(429);
});

test("one visitor using up their attempts doesn't lock out another", async () => {
  const app = limitedApp({ time: 0 });

  for (let index = 0; index < 5; index++) {
    await attempt(app, { "CF-Connecting-IP": "203.0.113.7" });
  }
  expect((await attempt(app, { "CF-Connecting-IP": "203.0.113.7" })).status).toBe(429);
  expect((await attempt(app, { "CF-Connecting-IP": "203.0.113.8" })).status).toBe(204);
});

test("expired entries are removed and the visitor can try again", async () => {
  const clock = { time: 0 };
  const attempts = new Map();
  const app = limitedApp(clock, attempts);

  for (let index = 0; index < 5; index++) {
    await attempt(app, { "CF-Connecting-IP": "203.0.113.7" });
  }
  await attempt(app, { "CF-Connecting-IP": "203.0.113.8" });
  expect(attempts.size).toBe(2);

  clock.time = WINDOW_MS + 1;
  expect((await attempt(app, { "CF-Connecting-IP": "203.0.113.9" })).status).toBe(204);
  expect([...attempts.keys()]).toEqual(["203.0.113.9"]);
  expect((await attempt(app, { "CF-Connecting-IP": "203.0.113.7" })).status).toBe(204);
});
