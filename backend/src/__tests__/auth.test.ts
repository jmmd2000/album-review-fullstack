import request from "supertest";
import { app } from "../index";
import { afterAll, test, expect, describe, beforeAll } from "@jest/globals";
import pg from "pg";

let pool: pg.Pool;
let authCookie: string[] = [];

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

describe("Auth (JWT + bcrypt)", () => {
  test("POST /api/auth/login succeeds with valid password and sets httpOnly cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: process.env.ADMIN_PASSWORD! });
    expect(res.status).toBe(204);

    const setCookie = res.get("set-cookie");
    authCookie = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    expect(authCookie.length).toBeGreaterThan(0);

    const tokenCookie = authCookie.find(c => c.startsWith("token="));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain("HttpOnly");
  });

  test("POST /api/auth/login fails with bad password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "wrong-password-12345" });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login fails with empty password", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "" });
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/status returns isAdmin: true with valid token", async () => {
    const res = await request(app).get("/api/auth/status").set("Cookie", authCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: true });
  });

  test("GET /api/auth/status returns isAdmin: false without cookie", async () => {
    const res = await request(app).get("/api/auth/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: false });
  });

  test("GET /api/auth/status returns isAdmin: false with tampered cookie", async () => {
    const res = await request(app)
      .get("/api/auth/status")
      .set("Cookie", ["token=fakejwttoken123"]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: false });
  });

  test("Protected route returns 401 without valid token", async () => {
    const res = await request(app).post("/api/albums/create").send({});
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/logout clears token cookie", async () => {
    const res = await request(app).post("/api/auth/logout").set("Cookie", authCookie);
    expect(res.status).toBe(204);

    const cookies = res.get("set-cookie") as string[] | undefined;
    const cookieStr = Array.isArray(cookies) ? cookies.join(";") : (cookies ?? "");
    expect(cookieStr).toContain("token=");
  });
});
