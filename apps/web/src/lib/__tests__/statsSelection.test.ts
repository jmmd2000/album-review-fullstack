import { describe, expect, it } from "vitest";
import { albumMatches, decadeOf, describeSelection } from "@/lib/statsSelection";

describe("decadeOf", () => {
  it("rounds down to the start of the decade", () => {
    expect(decadeOf(2017)).toBe(2010);
    expect(decadeOf(2020)).toBe(2020);
    expect(decadeOf(1999)).toBe(1990);
  });
});

describe("albumMatches", () => {
  const album = { genres: ["pop", "r&b"], releaseYear: 2017 };

  it("matches everything when nothing is picked", () => {
    expect(albumMatches(album, { genres: [], decade: null })).toBe(true);
  });

  it("matches an album in any of the picked genres", () => {
    expect(albumMatches(album, { genres: ["rock", "r&b"], decade: null })).toBe(true);
    expect(albumMatches(album, { genres: ["rock"], decade: null })).toBe(false);
  });

  it("needs both the genre and the decade to match", () => {
    expect(albumMatches(album, { genres: ["pop"], decade: 2010 })).toBe(true);
    expect(albumMatches(album, { genres: ["pop"], decade: 2020 })).toBe(false);
  });
});

describe("describeSelection", () => {
  it("says all when nothing is picked", () => {
    expect(describeSelection(200, [], null)).toBe("All 200 albums");
  });

  it("names one or two genres, and counts three or more", () => {
    expect(describeSelection(17, ["indie rock"], null)).toBe("17 indie rock albums");
    expect(describeSelection(4, ["pop", "r&b"], null)).toBe("4 pop and r&b albums");
    expect(describeSelection(9, ["pop", "r&b", "folk"], null)).toBe("9 albums in 3 genres");
  });

  it("adds the decade", () => {
    expect(describeSelection(120, [], 2020)).toBe("120 albums from the 2020s");
    expect(describeSelection(17, ["indie rock"], 2020)).toBe("17 indie rock albums from the 2020s");
  });

  it("uses the singular for one album", () => {
    expect(describeSelection(1, ["folk"], 1990)).toBe("1 folk album from the 1990s");
  });
});
