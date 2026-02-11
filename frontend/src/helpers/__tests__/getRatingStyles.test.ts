import { describe, it, expect } from "vitest";
import { getRatingStyles } from "../getRatingStyles";

describe("getRatingStyles", () => {
  it("returns 'Unrated' for 0", () => {
    expect(getRatingStyles(0).label).toBe("Unrated");
  });

  it("returns 'Terrible' for ratings 1-10", () => {
    expect(getRatingStyles(1).label).toBe("Terrible");
    expect(getRatingStyles(10).label).toBe("Terrible");
  });

  it("returns 'Amazing' for ratings 81-90", () => {
    expect(getRatingStyles(85).label).toBe("Amazing");
  });

  it("returns 'Perfect' for ratings 91-100", () => {
    expect(getRatingStyles(100).label).toBe("Perfect");
  });

  it("rounds up fractional ratings", () => {
    // 80.1 rounds up to 81, which is Amazing
    expect(getRatingStyles(80.1).label).toBe("Amazing");
  });

  it("returns 'Unrated' for undefined", () => {
    expect(getRatingStyles(undefined).label).toBe("Unrated");
  });

  it("accepts string labels", () => {
    expect(getRatingStyles("amazing").label).toBe("Amazing");
    expect(getRatingStyles("Meh").label).toBe("Meh");
  });

  it("throws for invalid numeric ratings", () => {
    expect(() => getRatingStyles(101)).toThrow();
    expect(() => getRatingStyles(-1)).toThrow();
  });

  it("throws for unknown string labels", () => {
    expect(() => getRatingStyles("random_string")).toThrow();
  });
});
