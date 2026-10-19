import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as Sentry from "@sentry/node";
import { buildErrorReportingOptions, reportError } from "@/lib/serverErrorReporting";

interface SentEvent {
  tags?: Record<string, string>;
  request?: { url?: string; headers?: unknown; cookies?: unknown };
}

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

describe("reportError", () => {
  it("sends the tags and the address of the page that failed", async () => {
    reportError(new Error("loader failed"), { side: "server", route: "/albums/" }, "http://localhost:3000/albums?sort=score");
    await Sentry.flush(2000);
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0]).toMatchObject({ tags: { side: "server", route: "/albums/" }, request: { url: "http://localhost:3000/albums?sort=score" } });
  });

  it("sends no page address when it has none", async () => {
    reportError(new Error("loader failed"), { side: "server" });
    await Sentry.flush(2000);
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0].request).toBeUndefined();
  });

  it("sends nothing from the request but its address", async () => {
    reportError(new Error("loader failed"), {}, "http://localhost:3000/albums");
    await Sentry.flush(2000);
    expect(Object.keys(sentEvents[0].request ?? {})).toEqual(["url"]);
  });
});
