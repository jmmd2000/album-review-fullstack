import { afterEach, describe, expect, it } from "vitest";
import * as Sentry from "@sentry/react";
import { ApiError } from "@/lib/client";
import { buildBrowserErrorReportingOptions, isLoaderError, reportBrowserError, startBrowserErrorReporting } from "@/lib/browserErrorReporting";

interface SentEvent {
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
}

let sentEvents: SentEvent[] = [];

/** Starts the SDK with the real options and a transport that keeps the events in memory. */
function startWithFakeTransport() {
  sentEvents = [];
  Sentry.init({
    ...buildBrowserErrorReportingOptions("https://key@glitchtip.invalid/1", "staging", "abc1234"),
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
}

afterEach(async () => {
  await Sentry.close();
  window.__GLITCHTIP__ = undefined;
});

describe("startBrowserErrorReporting", () => {
  it("does nothing when the server hands out no config", () => {
    window.__GLITCHTIP__ = null;
    startBrowserErrorReporting();
    expect(Sentry.getClient()).toBeUndefined();
  });

  it("starts with the environment from the config", () => {
    window.__GLITCHTIP__ = { dsn: "https://key@glitchtip.invalid/1", environment: "staging" };
    startBrowserErrorReporting();
    expect(Sentry.getClient()?.getOptions()).toMatchObject({ environment: "staging", release: "test-web-sha" });
  });
});

describe("reportBrowserError", () => {
  it("sends the error with the environment, the release and the browser side", async () => {
    startWithFakeTransport();
    reportBrowserError(new Error("boom"));
    await Sentry.flush(2000);
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0]).toMatchObject({ environment: "staging", release: "abc1234", tags: { side: "browser" } });
  });

  it("leaves out an ApiError, because the API reports its own errors", async () => {
    startWithFakeTransport();
    reportBrowserError(new ApiError("Server error", 500));
    await Sentry.flush(2000);
    expect(sentEvents).toHaveLength(0);
  });

  it("sends no cookies, query strings or page address", async () => {
    document.cookie = "token=secret-cookie-value";
    window.history.pushState({}, "", "/search?q=secret-search-term");
    startWithFakeTransport();
    reportBrowserError(new Error("boom"));
    await Sentry.flush(2000);
    const sent = JSON.stringify(sentEvents);
    expect(sentEvents).toHaveLength(1);
    expect(sent).not.toContain("secret-cookie-value");
    expect(sent).not.toContain("secret-search-term");
  });
});

describe("isLoaderError", () => {
  it("is true for an error that a route's loader threw", () => {
    const error = new Error("loader failed");
    expect(isLoaderError([{ error: undefined }, { error }], error)).toBe(true);
  });

  it("is false for any other error", () => {
    expect(isLoaderError([{ error: new Error("loader failed") }, {}], new Error("render failed"))).toBe(false);
  });
});
