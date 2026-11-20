import { describe, expect, it } from "vitest";
import { describePeriod } from "@/lib/listening";

describe("describePeriod", () => {
  it("names a custom range by its Dublin days", () => {
    expect(describePeriod("custom", "2026-07-01", "2026-07-31")).toBe("from 1 July 2026 to 31 July 2026");
    expect(describePeriod("custom", "2026-03-29", "2026-03-29")).toBe("on 29 March 2026");
  });
});
