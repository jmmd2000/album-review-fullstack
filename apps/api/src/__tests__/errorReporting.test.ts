import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as Sentry from "@sentry/node";
import { serve } from "@hono/node-server";
import { app } from "@/app";
import { AppError } from "@/api/AppError";
import { AuthService } from "@/api/services/AuthService";
import { buildErrorReportingOptions } from "@/config/errorReporting";
import { api } from "./apiRequest";

interface SentEvent {
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
}

const password = "correct-horse-battery-staple";
const cookie = "token=secret-cookie-value";
const authorisation = "Bearer secret-authorisation-value";
const searchTerm = "secret-search-term";

let sentEvents: SentEvent[] = [];

beforeAll(() => {
  Sentry.init({
    ...buildErrorReportingOptions("https://key@glitchtip.invalid/1", "staging", "abc1234"),
    transport: () => ({
      send: async envelope => {
        for (const [header, payload] of envelope[1]) {
          if (header.type === "event") sentEvents.push(payload as SentEvent);
        }
        return {};
      },
      flush: async () => true,
    }),
  });
});

afterAll(async () => {
  await Sentry.close();
});

beforeEach(() => {
  sentEvents = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Runs the app as a real HTTP server, so the SDK sees the same requests it sees in production. */
function listen(): Promise<{ url: string; close: () => void }> {
  return new Promise(resolve => {
    const server = serve({ fetch: app.fetch, port: 0 }, info => {
      resolve({ url: `http://127.0.0.1:${info.port}`, close: () => server.close() });
    });
  });
}

describe("an unexpected error in a request", () => {
  test("is reported with its environment, release, request ID, method and path, and without request data", async () => {
    vi.spyOn(AuthService, "authenticate").mockRejectedValue(new Error("the database is down"));
    const server = await listen();

    const res = await fetch(`${server.url}/api/auth/login?q=${searchTerm}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Authorization: authorisation },
      body: JSON.stringify({ password }),
    });
    await Sentry.flush(2000);
    server.close();

    expect(res.status).toBe(500);
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0]).toMatchObject({
      environment: "staging",
      release: "abc1234",
      tags: { requestID: res.headers.get("x-request-id"), method: "POST", path: "/api/auth/login" },
    });
    const sent = JSON.stringify(sentEvents);
    for (const secret of [password, cookie, authorisation, searchTerm]) {
      expect(sent).not.toContain(secret);
    }
  });
});

describe("an AppError", () => {
  test("is reported when its status is 500 or above", async () => {
    vi.spyOn(AuthService, "authenticate").mockRejectedValue(new AppError("Spotify is down", 503));

    const res = await api.post("/api/auth/login", { password });
    await Sentry.flush(2000);

    expect(res.status).toBe(503);
    expect(sentEvents).toHaveLength(1);
  });

  test("is not reported when its status is below 500", async () => {
    vi.spyOn(AuthService, "authenticate").mockRejectedValue(new AppError("Wrong password", 401));

    const res = await api.post("/api/auth/login", { password });
    await Sentry.flush(2000);

    expect(res.status).toBe(401);
    expect(sentEvents).toHaveLength(0);
  });
});

test("a request that fails validation is not reported", async () => {
  const res = await api.post("/api/auth/login", { password: "" });
  await Sentry.flush(2000);

  expect(res.status).toBe(400);
  expect(sentEvents).toHaveLength(0);
});
