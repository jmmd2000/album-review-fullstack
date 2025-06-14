import request from "supertest";
import { app } from "../index";
import { closeDatabase } from "../../db";
import { afterAll, test, expect } from "@jest/globals";

let authCookie: string[] = [];

const validPassword = process.env.ADMIN_PASSWORD ?? "123";

afterAll(async () => {
  await closeDatabase();
});

test("POST /api/auth/login succeeds and sets cookie", async () => {
  const res = await request(app).post("/api/auth/login").send({ password: validPassword });
  expect(res.status).toBe(204);
  const setCookie = res.get("set-cookie");
  authCookie = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  expect(authCookie.length).toBeGreaterThan(0);
});

test("POST /api/auth/login fails with bad password", async () => {
  const res = await request(app).post("/api/auth/login").send({ password: "bad" });
  expect(res.status).toBe(401);
});

test("GET /api/auth/status reflects logged in state", async () => {
  const res = await request(app).get("/api/auth/status").set("Cookie", authCookie);
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ isAdmin: true });
});

test("POST /api/auth/logout clears cookie", async () => {
  const res = await request(app).post("/api/auth/logout").set("Cookie", authCookie);
  expect(res.status).toBe(204);
  const cookies = res.get("set-cookie") as string[] | undefined;
  const cookieStr = Array.isArray(cookies) ? cookies.join(";") : cookies ?? "";
  expect(cookieStr).toContain("isadmin=");
});
