import { describe, expect, it } from "vitest";
import { describePeriod, roundedTop } from "@/lib/listening";

describe("describePeriod", () => {
  it("names a custom range by its Dublin days", () => {
    expect(describePeriod("custom", "2026-07-01", "2026-07-31")).toBe("from 1 July 2026 to 31 July 2026");
    expect(describePeriod("custom", "2026-03-29", "2026-03-29")).toBe("on 29 March 2026");
  });
});

describe("roundedTop", () => {
  it("rounds the most plays up to 1, 2 or 5 times a power of ten", () => {
    expect(roundedTop(0)).toBe(0);
    expect(roundedTop(7)).toBe(10);
    expect(roundedTop(1180)).toBe(2000);
    expect(roundedTop(500)).toBe(500);
    expect(roundedTop(501)).toBe(1000);
  });
});
