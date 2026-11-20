import { app } from "@/app";
import { closeDatabase } from "@/db/client";
import { afterAll, test, expect } from "vitest";

afterAll(async () => {
  await closeDatabase();
});

test("GET /api/health answers with the build and nothing else", async () => {
  const res = await app.request("/api/health");
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(Object.keys(body).sort()).toEqual(["builtAt", "gitSHA", "status", "version"]);
  expect(body.status).toBe("ok");
});
