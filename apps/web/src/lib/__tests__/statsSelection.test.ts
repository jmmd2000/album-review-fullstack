import { describe, expect, it } from "vitest";
import { albumMatches, decadeOf, describeSelection, highsAndLows, nameSelection, scoreArtistsInSelection } from "@/lib/statsSelection";

import type { StatsAlbum, StatsArtist } from "@shared/types";

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

describe("nameSelection", () => {
  it("is empty when nothing is picked", () => {
    expect(nameSelection([], null)).toBe("");
  });

  it("names the genres and the decade", () => {
    expect(nameSelection(["pop"], null)).toBe("Albums in pop");
    expect(nameSelection(["pop", "r&b"], 2010)).toBe("Albums in pop and r&b from the 2010s");
    expect(nameSelection(["pop", "r&b", "folk"], null)).toBe("Albums in 3 genres");
    expect(nameSelection([], 2020)).toBe("Albums from the 2020s");
  });
});

describe("highsAndLows", () => {
  const score = (item: number) => item;

  it("takes the five highest and the five lowest", () => {
    const { highest, lowest } = highsAndLows([50, 90, 10, 70, 30, 80, 20, 60, 40, 100, 5], score);
    expect(highest).toEqual([100, 90, 80, 70, 60]);
    expect(lowest).toEqual([5, 10, 20, 30, 40]);
  });

  it("never repeats a high in the lows", () => {
    const { highest, lowest } = highsAndLows([60, 20, 80, 40, 70, 50, 30], score);
    expect(highest).toEqual([80, 70, 60, 50, 40]);
    expect(lowest).toEqual([20, 30]);
  });
});

describe("scoreArtistsInSelection", () => {
  const artist = (spotifyID: string, totalScore: number): StatsArtist => ({ spotifyID, name: spotifyID, imageURLs: [], totalScore, albumCount: 4 });
  const album = (spotifyID: string, finalScore: number, artistSpotifyIDs: string[]): StatsAlbum => ({
    spotifyID,
    name: spotifyID,
    artistName: artistSpotifyIDs[0],
    releaseYear: 2015,
    finalScore,
    imageURLs: [],
    genres: ["shoegaze"],
    artistSpotifyIDs,
  });

  it("ranks artists on their albums in the selection, not their career score", () => {
    const artists = [artist("career-high", 90), artist("career-low", 40)];
    const selected = [album("weak", 30, ["career-high"]), album("strong", 85, ["career-low"]), album("solid", 75, ["career-low"])];

    const ranked = highsAndLows(scoreArtistsInSelection(artists, selected), scored => scored.totalScore);

    expect(ranked.highest.map(scored => [scored.spotifyID, scored.totalScore, scored.albumCount])).toEqual([
      ["career-low", 80, 2],
      ["career-high", 30, 1],
    ]);
  });

  it("leaves out artists with no album in the selection", () => {
    const scored = scoreArtistsInSelection([artist("in", 60), artist("out", 70)], [album("only", 50, ["in"])]);

    expect(scored.map(each => each.spotifyID)).toEqual(["in"]);
  });
});
