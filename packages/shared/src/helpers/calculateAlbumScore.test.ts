import { describe, it, expect } from "vitest";

import { calculateAlbumScore } from "./calculateAlbumScore";
import type { DisplayTrack } from "../types";

const track = (rating: number, index: number): DisplayTrack => ({
  spotifyID: `track-${index}`,
  artistSpotifyID: "artist-1",
  artistName: "Test Artist",
  name: `Track ${index + 1}`,
  duration: 200000,
  features: [],
  rating,
});

const tracks = (...ratings: number[]): DisplayTrack[] => ratings.map((rating, index) => track(rating, index));

const zeroBreakdown = {
  baseScore: 0,
  bonuses: {
    qualityBonus: 0,
    perfectBonus: 0,
    consistencyBonus: 0,
    noWeakBonus: 0,
    terriblePenalty: 0,
    poorQualityPenalty: 0,
    noStrongPenalty: 0,
    totalBonus: 0,
  },
  finalScore: 0,
};

describe("calculateAlbumScore", () => {
  it("returns a zero breakdown when there are no tracks", () => {
    expect(calculateAlbumScore([])).toEqual(zeroBreakdown);
  });

  it("returns a zero breakdown when every track is rated 0", () => {
    expect(calculateAlbumScore(tracks(0, 0, 0))).toEqual(zeroBreakdown);
  });

  it("ignores tracks rated 0 entirely", () => {
    expect(calculateAlbumScore(tracks(10, 10, 0))).toEqual(calculateAlbumScore(tracks(10, 10)));
  });

  it("scores a perfect album at 100 with the perfect, consistency and no-weak bonuses", () => {
    const result = calculateAlbumScore(tracks(10, 10, 10, 10, 10, 10, 10, 10, 10, 10));

    expect(result.baseScore).toBe(100);
    expect(result.bonuses.perfectBonus).toBe(1.5);
    expect(result.bonuses.consistencyBonus).toBe(1);
    expect(result.bonuses.noWeakBonus).toBe(1);
    expect(result.bonuses.totalBonus).toBe(3.5);
    expect(result.finalScore).toBe(100);
  });

  it("caps the quality bonus for an album full of 8s and 9s", () => {
    const result = calculateAlbumScore(tracks(8, 9, 8, 9));

    expect(result.baseScore).toBe(85);
    expect(result.bonuses.qualityBonus).toBe(1.5);
    expect(result.bonuses.consistencyBonus).toBe(0.5);
    expect(result.bonuses.noWeakBonus).toBe(1);
    expect(result.bonuses.totalBonus).toBe(3);
    expect(result.finalScore).toBe(88);
  });

  it("caps the terrible penalty at -3 and rounds the final score up", () => {
    const result = calculateAlbumScore(tracks(1, 1, 1, 1, 10));

    expect(result.baseScore).toBe(28);
    expect(result.bonuses.terriblePenalty).toBe(-3);
    expect(result.bonuses.perfectBonus).toBe(0.5);
    expect(result.bonuses.totalBonus).toBe(-2.5);
    // 28 - 2.5 = 25.5, rounded up with Math.ceil
    expect(result.finalScore).toBe(26);
  });

  it("applies the poor quality and no-strong penalties together", () => {
    const result = calculateAlbumScore(tracks(2, 3, 2, 3));

    expect(result.baseScore).toBe(25);
    expect(result.bonuses.poorQualityPenalty).toBe(-2);
    expect(result.bonuses.noStrongPenalty).toBe(-2);
    expect(result.bonuses.consistencyBonus).toBe(0.5);
    expect(result.bonuses.totalBonus).toBe(-3.5);
    expect(result.finalScore).toBe(22);
  });

  it("caps the total adjustment at -5", () => {
    const result = calculateAlbumScore(tracks(1, 1, 1, 2, 2));

    expect(result.baseScore).toBe(14);
    expect(result.bonuses.terriblePenalty).toBe(-3);
    expect(result.bonuses.poorQualityPenalty).toBe(-1.6);
    expect(result.bonuses.noStrongPenalty).toBe(-2);
    expect(result.bonuses.consistencyBonus).toBe(0.6);
    expect(result.bonuses.totalBonus).toBe(-5);
    expect(result.finalScore).toBe(9);
  });

  it("only awards the consistency bonus when the rating range is 2 or less", () => {
    const tight = calculateAlbumScore(tracks(7, 7, 8, 8));
    const spread = calculateAlbumScore(tracks(4, 6, 8, 10));

    expect(tight.bonuses.consistencyBonus).toBeGreaterThan(0);
    expect(spread.bonuses.consistencyBonus).toBe(0);
  });
});
