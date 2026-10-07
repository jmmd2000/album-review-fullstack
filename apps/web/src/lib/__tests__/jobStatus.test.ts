import { describe, test, expect, vi, afterEach } from "vitest";
import { describeJobResult, formatJobCounts } from "@/lib/jobStatus";
import type { ArtistJobResult } from "@/lib/jobStatus";

const result = (changes: Partial<ArtistJobResult>): ArtistJobResult => ({
  source: "scheduled",
  finishedAt: "2026-10-12T03:05:00.000Z",
  updated: 4,
  unchanged: 130,
  failed: 0,
  stoppedEarly: false,
  ...changes,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatJobCounts", () => {
  test("leaves out the failed count when nothing failed", () => {
    expect(formatJobCounts(4, 130, 0)).toBe("4 updated, 130 unchanged");
    expect(formatJobCounts(4, 130, 2)).toBe("4 updated, 130 unchanged, 2 failed");
  });
});

describe("describeJobResult", () => {
  test("names the source and gives the counts", () => {
    expect(describeJobResult(result({}))).toBe("Scheduled run: 4 updated, 130 unchanged");
    expect(describeJobResult(result({ source: "manual", failed: 1 }))).toBe("Manual run: 4 updated, 130 unchanged, 1 failed");
  });

  test("a run that stopped early says when, not the counts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T05:05:00.000Z"));
    expect(describeJobResult(result({ stoppedEarly: true }))).toBe("Scheduled run stopped early 2 hours ago");
  });
});
