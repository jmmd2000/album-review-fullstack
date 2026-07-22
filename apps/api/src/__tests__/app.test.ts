import { app } from "@/app";
import { closeDatabase } from "@/db/client";
import { afterAll, test, expect } from "vitest";

afterAll(async () => {
  await closeDatabase();
});

test("GET /api/health returns 200 with ok true", async () => {
  const res = await app.request("/api/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});
