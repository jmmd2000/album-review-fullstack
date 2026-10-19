import { afterEach, describe, expect, it } from "vitest";
import * as Sentry from "@sentry/react";
import { ApiError } from "@/lib/client";
import { buildBrowserErrorReportingOptions, isLoaderError, reportBrowserError, startBrowserErrorReporting } from "@/lib/browserErrorReporting";

interface SentEvent {
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  request?: { url?: string; headers?: Record<string, string> };
  breadcrumbs?: { category?: string; message?: string }[];
}

let sentEvents: SentEvent[] = [];

/** Starts the SDK with the real options and a transport that keeps the events in memory. */
function startWithFakeTransport() {
  sentEvents = [];
  Sentry.getCurrentScope().clearBreadcrumbs();
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

  it("sends the page address and the browser, and nothing else about the request", async () => {
    document.cookie = "token=secret-cookie-value";
    window.history.pushState({}, "", "/search?q=some-term");
    startWithFakeTransport();
    reportBrowserError(new Error("boom"));
    await Sentry.flush(2000);
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0].request).toEqual({ url: `${window.location.origin}/search?q=some-term`, headers: { "User-Agent": navigator.userAgent } });
    expect(JSON.stringify(sentEvents)).not.toContain("secret-cookie-value");
  });
});

describe("the actions before an error", () => {
  it("are clicks, page changes and failed API calls, and never typed text", async () => {
    startWithFakeTransport();
    const field = document.createElement("input");
    field.name = "password";
    const button = document.createElement("button");
    button.id = "save";
    document.body.append(field, button);

    field.value = "typed-secret-text";
    field.dispatchEvent(new KeyboardEvent("keypress", { bubbles: true, key: "t" }));
    button.click();
    window.history.pushState({}, "", "/albums?page=2");
    await fetch("http://127.0.0.1:1/api/albums?page=2").catch(() => undefined);
    reportBrowserError(new Error("boom"));
    await Sentry.flush(2000);

    const categories = sentEvents[0].breadcrumbs?.map(breadcrumb => breadcrumb.category);
    expect(categories).toEqual(expect.arrayContaining(["ui.click", "navigation", "fetch"]));
    expect(categories).not.toContain("ui.input");
    expect(JSON.stringify(sentEvents)).not.toContain("typed-secret-text");
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
