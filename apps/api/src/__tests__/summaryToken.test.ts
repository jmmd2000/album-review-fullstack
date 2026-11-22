import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, test } from "vitest";
import { env } from "@/config/env";
import { requireSummaryToken } from "@/api/middleware/requireSummaryToken";

const TOKEN = "a-made-up-summary-token-of-40-characters";
const originalToken = env.SUMMARY_TOKEN;

const guarded = new Hono()
  .use(requireSummaryToken)
  .get("/", c => c.json({ ok: true }, 200))
  .onError((error, c) => (error instanceof HTTPException ? c.json({ message: error.message }, error.status) : c.json({ message: "error" }, 500)));

const request = (authorization?: string) => guarded.request("/", authorization ? { headers: { Authorization: authorization } } : undefined);

afterEach(() => {
  env.SUMMARY_TOKEN = originalToken;
});

describe("requireSummaryToken", () => {
  test("lets the right token through", async () => {
    env.SUMMARY_TOKEN = TOKEN;
    expect((await request(`Bearer ${TOKEN}`)).status).toBe(200);
  });

  test("refuses a missing, wrong or badly formed token", async () => {
    env.SUMMARY_TOKEN = TOKEN;
    expect((await request()).status).toBe(401);
    expect((await request(`Bearer ${TOKEN}x`)).status).toBe(401);
    expect((await request(TOKEN)).status).toBe(401);
    expect((await request("Bearer ")).status).toBe(401);
  });

  test("refuses every request when no token is set", async () => {
    env.SUMMARY_TOKEN = undefined;
    expect((await request(`Bearer ${TOKEN}`)).status).toBe(401);
    expect((await request("Bearer ")).status).toBe(401);
  });
});
