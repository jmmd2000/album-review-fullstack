import { describe, expect, it } from "vitest";
import { groupBySeparator, letterSeparator, scoreSeparator, yearSeparator } from "@/lib/separators";

describe("letterSeparator", () => {
  it("files a name under its first letter, in capitals", () => {
    expect(letterSeparator("beabadoobee").label).toBe("B");
  });

  it("skips leading punctuation, as the database sort does", () => {
    expect(letterSeparator("- (Deluxe)").label).toBe("D");
    expect(letterSeparator("÷ (Deluxe)").label).toBe("D");
    expect(letterSeparator("(What's the Story) Morning Glory?").label).toBe("W");
  });

  it("files an accented letter under the plain one", () => {
    expect(letterSeparator("Élan").label).toBe("E");
  });

  it("files names starting with a number, or with no letters, under #", () => {
    expect(letterSeparator("3D Country").label).toBe("#");
    expect(letterSeparator("22, A Million").label).toBe("#");
    expect(letterSeparator("+").label).toBe("#");
  });
});

describe("groupBySeparator", () => {
  it("starts a new group each time the separator changes", () => {
    const groups = groupBySeparator([95, 91, 88, 72, 71], scoreSeparator);
    expect(groups.map(group => [group.separator?.label, group.items])).toEqual([
      ["Perfect", [95, 91]],
      ["Amazing", [88]],
      ["Brilliant", [72, 71]],
    ]);
  });

  it("keeps the tier on score groups only", () => {
    expect(groupBySeparator([95], scoreSeparator)[0].separator).toEqual({ label: "Perfect", tier: "Perfect" });
    expect(groupBySeparator([2024], yearSeparator)[0].separator).toEqual({ label: "2024" });
  });

  it("gives one untitled group when the list isn't grouped", () => {
    expect(groupBySeparator([3, 2, 1], () => null)).toEqual([{ separator: null, items: [3, 2, 1] }]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupBySeparator([], scoreSeparator)).toEqual([]);
  });
});
