import { describe, it, expect } from "vitest";

import getTotalDuration, { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("formats short durations as minutes and padded seconds", () => {
    expect(formatDuration(210000, "short")).toBe("3:30");
    expect(formatDuration(61000, "short")).toBe("1:01");
    expect(formatDuration(59000, "short")).toBe("0:59");
    expect(formatDuration(60000, "short")).toBe("1:00");
  });

  it("truncates partial seconds instead of rounding up", () => {
    expect(formatDuration(59999, "short")).toBe("0:59");
  });

  it("formats long durations with pluralised units", () => {
    expect(formatDuration(210000, "long")).toBe("3 minutes 30 seconds");
    expect(formatDuration(121000, "long")).toBe("2 minutes 1 second");
  });

  it("drops the seconds part on an exact minute", () => {
    expect(formatDuration(60000, "long")).toBe("1 minute");
  });

  it("drops the minutes part under a minute", () => {
    expect(formatDuration(1000, "long")).toBe("1 second");
  });

  it("throws on an unknown form", () => {
    expect(() => formatDuration(1000, "medium" as never)).toThrow();
  });
});

describe("getTotalDuration", () => {
  it("sums the track durations and formats them in long form", () => {
    const album = { tracks: { items: [{ duration_ms: 120000 }, { duration_ms: 45000 }] } };
    expect(getTotalDuration(album)).toBe("2 minutes 45 seconds");
  });
});
