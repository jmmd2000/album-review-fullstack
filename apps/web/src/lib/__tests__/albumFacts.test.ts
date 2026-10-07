import { describe, expect, it } from "vitest";
import { reviewedDate, shortRuntime, ukReleaseDate } from "@/lib/albumFacts";

describe("ukReleaseDate", () => {
  it("puts the day first and drops the ordinal", () => {
    expect(ukReleaseDate("February 19th, 2008")).toBe("19 February 2008");
    expect(ukReleaseDate("August 1st, 2025")).toBe("1 August 2025");
  });

  it("passes month-only and year-only dates through", () => {
    expect(ukReleaseDate("September 2023")).toBe("September 2023");
    expect(ukReleaseDate("2004")).toBe("2004");
  });
});

describe("shortRuntime", () => {
  it("rounds down to whole minutes", () => {
    expect(shortRuntime("37 minutes 15 seconds")).toBe("37 min");
  });

  it("counts hours as minutes", () => {
    expect(shortRuntime("1 hour 2 minutes 30 seconds")).toBe("62 min");
    expect(shortRuntime("2 hours 1 minute")).toBe("121 min");
  });

  it("passes anything it can't read through", () => {
    expect(shortRuntime("45:12")).toBe("45:12");
  });
});

describe("reviewedDate", () => {
  it("uses the UK day, even late in the evening UTC", () => {
    // 23:30 UTC in summer is already the next day in London
    expect(reviewedDate("2025-08-02T23:30:00.000Z")).toBe("3 August 2025");
  });
});
