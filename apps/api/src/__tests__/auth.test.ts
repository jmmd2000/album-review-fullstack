import { app } from "@/app";
import { closeDatabase } from "@/db/client";
import { afterAll, test, expect, describe } from "@jest/globals";

afterAll(async () => {
  await closeDatabase();
});

const login = (password: string) =>
  app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

describe("Auth (JWT + bcrypt)", () => {
  test("login succeeds with the valid password and sets an httpOnly cookie", async () => {
    const res = await login(process.env.ADMIN_PASSWORD!);
    expect(res.status).toBe(204);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("token=");
    expect(setCookie).toContain("HttpOnly");
  });

  test("login fails with a bad password", async () => {
    expect((await login("wrong-password-12345")).status).toBe(401);
  });

  test("login fails with an empty password", async () => {
    expect((await login("")).status).toBe(400);
  });

  test("status is true with a valid token", async () => {
    const cookie = (await login(process.env.ADMIN_PASSWORD!)).headers.get("set-cookie")!.split(";")[0];
    const res = await app.request("/api/auth/status", { headers: { Cookie: cookie } });
    expect(await res.json()).toEqual({ isAdmin: true });
  });

  test("status is false without a cookie", async () => {
    const res = await app.request("/api/auth/status");
    expect(await res.json()).toEqual({ isAdmin: false });
  });

  test("status is false with a tampered cookie", async () => {
    const res = await app.request("/api/auth/status", { headers: { Cookie: "token=fakejwttoken123" } });
    expect(await res.json()).toEqual({ isAdmin: false });
  });

  test("logout clears the token cookie", async () => {
    const res = await app.request("/api/auth/logout", { method: "POST" });
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toContain("token=");
  });
});
