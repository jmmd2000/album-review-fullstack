import { describe, it, expect } from "vitest";

import { calculateAlbumScore } from "./calculateAlbumScore";

const tracks = (...ratings: number[]) => ratings.map(rating => ({ rating }));

describe("calculateAlbumScore", () => {
  it("scores 0 when no track is rated, whatever the bonus", () => {
    expect(calculateAlbumScore([], 3)).toEqual({ baseScore: 0, finalScore: 0 });
    expect(calculateAlbumScore(tracks(0, 0, 0), 3)).toEqual({ baseScore: 0, finalScore: 0 });
  });

  it("ignores tracks rated 0 and tracks with no rating", () => {
    expect(calculateAlbumScore([...tracks(10, 8, 0), {}], 0)).toEqual(calculateAlbumScore(tracks(10, 8), 0));
  });

  it("rounds the track average to a whole number before adding the bonus", () => {
    // 7, 8, 8 averages 7.67, so the tracks give 77
    expect(calculateAlbumScore(tracks(7, 8, 8), 0)).toEqual({ baseScore: 77, finalScore: 77 });
  });

  it("adds the bonus and rounds the final score up", () => {
    expect(calculateAlbumScore(tracks(8, 9), 2.3)).toEqual({ baseScore: 85, finalScore: 88 });
    expect(calculateAlbumScore(tracks(8, 9), -2.5)).toEqual({ baseScore: 85, finalScore: 83 });
  });

  it("keeps the final score between 1 and 100", () => {
    expect(calculateAlbumScore(tracks(10, 10), 5).finalScore).toBe(100);
    expect(calculateAlbumScore(tracks(1, 1), -5).finalScore).toBe(5);
    expect(calculateAlbumScore(tracks(1), -15).finalScore).toBe(1);
  });
});
