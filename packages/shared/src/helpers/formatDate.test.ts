import { describe, it, expect } from "vitest";

import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats a full date with an ordinal suffix", () => {
    expect(formatDate("2023-09-22")).toBe("September 22nd, 2023");
  });

  it("formats a year-and-month date without a day", () => {
    expect(formatDate("2023-09")).toBe("September 2023");
  });

  it("returns a year-only date unchanged", () => {
    expect(formatDate("2023")).toBe("2023");
  });

  it("applies the correct ordinal suffixes", () => {
    expect(formatDate("2023-09-01")).toBe("September 1st, 2023");
    expect(formatDate("2023-09-02")).toBe("September 2nd, 2023");
    expect(formatDate("2023-09-03")).toBe("September 3rd, 2023");
    expect(formatDate("2023-09-04")).toBe("September 4th, 2023");
  });

  it("returns unparseable input unchanged instead of throwing", () => {
    expect(() => formatDate("not-a-date")).not.toThrow();
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});
