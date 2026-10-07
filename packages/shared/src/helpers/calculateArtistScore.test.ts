import { describe, it, expect } from "vitest";

import { calculateArtistScore, weighReleases } from "./calculateArtistScore";
import type { ScoredRelease } from "./calculateArtistScore";

const release = (spotifyID: string, finalScore: number, ratedTracks: number, releaseDate: string): ScoredRelease => ({
  spotifyID,
  finalScore,
  ratedTracks,
  releaseDate,
  releaseYear: Number(releaseDate.slice(0, 4)),
});

describe("weighReleases", () => {
  it("ranks the releases best first and decays each weight by 0.6 a place", () => {
    const weighted = weighReleases([release("c", 70, 10, "2022-01-01"), release("a", 90, 10, "2020-01-01"), release("b", 80, 10, "2021-01-01")]);

    expect(weighted.map(({ release }) => release.spotifyID)).toEqual(["a", "b", "c"]);
    expect(weighted[0].weight).toBe(10);
    expect(weighted[1].weight).toBeCloseTo(6);
    expect(weighted[2].weight).toBeCloseTo(3.6);
  });

  it("gives a release with more rated tracks more weight", () => {
    const [album, ep] = weighReleases([release("album", 80, 12, "2020-01-01"), release("ep", 79, 4, "2021-01-01")]);

    expect(album.weight).toBe(12);
    expect(ep.weight).toBeCloseTo(2.4);
  });

  it("orders equal scores by rated tracks, whatever the input order", () => {
    const releases = [release("small", 80, 5, "2020-01-01"), release("big", 80, 12, "2021-01-01")];

    expect(weighReleases(releases).map(({ release }) => release.spotifyID)).toEqual(["big", "small"]);
    expect(weighReleases([...releases].reverse()).map(({ release }) => release.spotifyID)).toEqual(["big", "small"]);
  });

  it("leaves out releases with no rated tracks", () => {
    expect(weighReleases([release("a", 90, 10, "2020-01-01"), release("empty", 0, 0, "2021-01-01")])).toHaveLength(1);
  });
});

describe("calculateArtistScore", () => {
  it("leaves an artist with no rated releases unrated", () => {
    expect(calculateArtistScore([])).toBeNull();
    expect(calculateArtistScore([release("empty", 0, 0, "2020-01-01")])).toBeNull();
  });

  it("discounts an artist with one release to 0.9 of its score", () => {
    expect(calculateArtistScore([release("debut", 90, 10, "2020-01-01")])).toEqual({ totalScore: 81, peakScore: 90, latestScore: 90 });
  });

  it("scores two or more releases with the decayed mean, not the discount", () => {
    // Weights 10 and 6: (90 x 10 + 80 x 6) / 16
    expect(calculateArtistScore([release("a", 90, 10, "2020-01-01"), release("b", 80, 10, "2021-01-01")])?.totalScore).toBeCloseTo(86.25);
  });

  it("matches the spec's worked example for Magdalena Bay at 0.6", () => {
    const score = calculateArtistScore([
      release("imaginal-disk", 98, 13, "2024-08-23"),
      release("mercurial-world", 87, 13, "2021-10-08"),
      release("a-little-rhythm", 79, 8, "2019-01-01"),
      release("mini-mix-1", 78, 6, "2020-01-01"),
      release("mini-mix-2", 76, 7, "2020-06-01"),
      release("mini-mix-3", 74, 7, "2023-01-01"),
    ]);

    // The spec rounds this to 90.5
    expect(score?.totalScore).toBeCloseTo(90.45, 2);
    expect(score?.peakScore).toBe(98);
  });

  it("averages the latest three releases by date, weighted by rated tracks", () => {
    const score = calculateArtistScore([
      release("old-best", 95, 10, "2010-01-01"),
      release("album", 80, 12, "2020-01-01"),
      release("ep", 60, 4, "2021-01-01"),
      release("newest", 82, 10, "2022-01-01"),
    ]);

    // (80 x 12 + 60 x 4 + 82 x 10) / 26
    expect(score?.latestScore).toBeCloseTo(77.69, 2);
    expect(score?.peakScore).toBe(95);
  });

  it("sorts a year-only release date by its year", () => {
    const score = calculateArtistScore([
      release("a", 90, 10, "2015-05-01"),
      { spotifyID: "b", finalScore: 50, ratedTracks: 10, releaseDate: "2024", releaseYear: 2024 },
      release("c", 70, 10, "2018-01-01"),
      release("d", 60, 10, "2012-01-01"),
    ]);

    // The latest three are b, c and a
    expect(score?.latestScore).toBeCloseTo(70);
  });
});
