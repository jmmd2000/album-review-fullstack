import request from "supertest";
import { afterAll, test, expect } from "@jest/globals";

import { app } from "../index";
import { closeDatabase } from "@/db/client";

test("GET /api/health - returns 200 and ok when the database is reachable", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

afterAll(async () => {
  await closeDatabase();
});
