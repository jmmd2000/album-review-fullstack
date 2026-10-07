import { describe, expect, it } from "vitest";
import { pageNumbers } from "@/lib/pageNumbers";

describe("pageNumbers", () => {
  it("shows a lone page on its own", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
  });

  it("puts a gap between the start and the last page", () => {
    expect(pageNumbers(1, 6)).toEqual([1, 2, "gap", 6]);
  });

  it("puts gaps on both sides of a page in the middle", () => {
    expect(pageNumbers(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });

  it("shows a single skipped page instead of a gap", () => {
    expect(pageNumbers(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ends on the last page without repeating it", () => {
    expect(pageNumbers(6, 6)).toEqual([1, "gap", 5, 6]);
  });
});
