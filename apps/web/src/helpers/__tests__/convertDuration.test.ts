import { describe, it, expect } from "vitest";
import { convertDuration } from "../convertDuration";

describe("convertDuration", () => {
  it("formats minutes and seconds", () => {
    expect(convertDuration(210000)).toBe("3:30");
  });

  it("pads single-digit seconds", () => {
    expect(convertDuration(61000)).toBe("1:01");
  });

  it("shows zero minutes under a minute", () => {
    expect(convertDuration(59000)).toBe("0:59");
  });

  it("handles an exact minute", () => {
    expect(convertDuration(60000)).toBe("1:00");
  });
});
