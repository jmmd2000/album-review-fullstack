import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  test,
  expect,
  jest,
  describe,
} from "@jest/globals";
import { closeDatabase, query } from "../../db";
import { resetTables } from "./testUtils";
import {
  calculatePeakScore,
  calculateLatestScore,
} from "../helpers/calculatePeakAndLatestScores";
import { calculateArtistScore } from "../helpers/calculateArtistScore";
import { calculateLeaderboardPositions } from "../helpers/calculateLeaderboardPositions";
import type { ReviewedAlbum } from "@shared/types";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

describe("Score Calculation Functions", () => {
  describe("calculatePeakScore", () => {
    test("should calculate peak score from top 3 albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, true),
        createMockAlbum(80, 2021, true),
        createMockAlbum(70, 2022, true),
        createMockAlbum(60, 2023, true),
        createMockAlbum(50, 2024, true),
      ];

      const peakScore = calculatePeakScore(albums);

      // Should use top 3: 90, 80, 70
      // Average: (90 + 80 + 70) / 3 = 80
      // Rounded up: 80
      // All 3 albums > 55, so bonus: 3 * 0.25 = 0.75
      // Total: 80 + 0.75 = 80.75
      expect(peakScore).toBe(80.75);
    });

    test("should handle less than 3 albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, true),
        createMockAlbum(80, 2021, true),
      ];

      const peakScore = calculatePeakScore(albums);

      // Should use both albums: 90, 80
      // Average: (90 + 80) / 2 = 85
      // Rounded up: 85
      // Only 2 albums, so no bonus
      // Total: 85
      expect(peakScore).toBe(85);
    });

    test("should handle albums that don't affect artist score", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, true),
        createMockAlbum(80, 2021, false), // Doesn't affect score
        createMockAlbum(70, 2022, true),
        createMockAlbum(60, 2023, false), // Doesn't affect score
      ];

      const peakScore = calculatePeakScore(albums);

      // Should only use albums that affect score: 90, 70
      // Average: (90 + 70) / 2 = 80
      // Rounded up: 80
      // Only 2 albums, so no bonus
      // Total: 80
      expect(peakScore).toBe(80);
    });

    test("should apply penalties for low-quality albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(40, 2020, true), // Low quality
        createMockAlbum(30, 2021, true), // Low quality
        createMockAlbum(20, 2022, true), // Low quality
      ];

      const peakScore = calculatePeakScore(albums);

      // Average: (40 + 30 + 20) / 3 = 30
      // Rounded up: 30
      // All 3 albums < 45, so penalty: 3 * -0.25 = -0.75
      // Total: 30 - 0.75 = 29.25
      expect(peakScore).toBe(29.25);
    });

    test("should cap score at 100", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(95, 2020, true),
        createMockAlbum(95, 2021, true),
        createMockAlbum(95, 2022, true),
      ];

      const peakScore = calculatePeakScore(albums);

      // Average: 95
      // Rounded up: 95
      // All 3 albums > 55, so bonus: 3 * 0.25 = 0.75
      // Total: 95 + 0.75 = 95.75 (should not exceed 100)
      expect(peakScore).toBe(95.75);
    });

    test("should return 0 for no contributing albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, false),
        createMockAlbum(80, 2021, false),
      ];

      const peakScore = calculatePeakScore(albums);
      expect(peakScore).toBe(0);
    });
  });

  describe("calculateLatestScore", () => {
    test("should calculate latest score from most recent 3 albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(50, 2020, true), // Oldest
        createMockAlbum(60, 2021, true),
        createMockAlbum(70, 2022, true),
        createMockAlbum(80, 2023, true),
        createMockAlbum(90, 2024, true), // Newest
      ];

      const latestScore = calculateLatestScore(albums);

      // Should use latest 3: 90, 80, 70
      // Average: (90 + 80 + 70) / 3 = 80
      // Rounded up: 80
      // All 3 albums > 55, so bonus: 3 * 0.25 = 0.75
      // Total: 80 + 0.75 = 80.75
      expect(latestScore).toBe(80.75);
    });

    test("should handle less than 3 albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2023, true),
        createMockAlbum(80, 2024, true),
      ];

      const latestScore = calculateLatestScore(albums);

      // Should use both albums: 90, 80
      // Average: (90 + 80) / 2 = 85
      // Rounded up: 85
      // Only 2 albums, so no bonus
      // Total: 85
      expect(latestScore).toBe(85);
    });

    test("should handle albums that don't affect artist score", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, false), // Doesn't affect score
        createMockAlbum(80, 2021, true),
        createMockAlbum(70, 2022, false), // Doesn't affect score
        createMockAlbum(60, 2023, true),
      ];

      const latestScore = calculateLatestScore(albums);

      // Should only use albums that affect score: 80, 60
      // Average: (80 + 60) / 2 = 70
      // Rounded up: 70
      // Only 2 albums, so no bonus
      // Total: 70
      expect(latestScore).toBe(70);
    });

    test("should apply penalties for low-quality albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(40, 2022, true), // Low quality
        createMockAlbum(30, 2023, true), // Low quality
        createMockAlbum(20, 2024, true), // Low quality
      ];

      const latestScore = calculateLatestScore(albums);

      // Average: (40 + 30 + 20) / 3 = 30
      // Rounded up: 30
      // All 3 albums < 45, so penalty: 3 * -0.25 = -0.75
      // Total: 30 - 0.75 = 29.25
      expect(latestScore).toBe(29.25);
    });

    test("should return 0 for no contributing albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, false),
        createMockAlbum(80, 2021, false),
      ];

      const latestScore = calculateLatestScore(albums);
      expect(latestScore).toBe(0);
    });
  });

  describe("calculateArtistScore integration", () => {
    test("should calculate all three scores correctly", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(90, 2020, true),
        createMockAlbum(80, 2021, true),
        createMockAlbum(70, 2022, true),
        createMockAlbum(60, 2023, true),
        createMockAlbum(50, 2024, true),
      ];

      const result = calculateArtistScore(albums);

      // Overall: average of all 5 albums = (90+80+70+60+50)/5 = 70
      // Peak: top 3 = (90+80+70)/3 = 80
      // Latest: latest 3 = (50+60+70)/3 = 60
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.peakScore).toBeGreaterThan(0);
      expect(result.latestScore).toBeGreaterThan(0);
      expect(result.peakScore).toBeGreaterThan(result.latestScore);
    });

    test("should handle identical scores for artist with exactly 3 albums", () => {
      const albums: ReviewedAlbum[] = [
        createMockAlbum(82, 2020, true),
        createMockAlbum(78, 2021, true),
        createMockAlbum(76, 2022, true),
      ];

      const result = calculateArtistScore(albums);

      // For exactly 3 albums, all scores should be identical
      expect(result.totalScore).toBe(result.peakScore);
      expect(result.peakScore).toBe(result.latestScore);
      expect(result.latestScore).toBe(result.totalScore);
    });
  });

  describe("calculateLeaderboardPositions", () => {
    test("should assign correct positions for unique scores", () => {
      const artists = [
        { id: 1, name: "Artist 1", score: 90 },
        { id: 2, name: "Artist 2", score: 80 },
        { id: 3, name: "Artist 3", score: 70 },
        { id: 4, name: "Artist 4", score: 60 },
      ];

      const positions = calculateLeaderboardPositions(artists);

      expect(positions).toHaveLength(4);
      expect(positions[0]).toEqual({
        id: 1,
        name: "Artist 1",
        score: 90,
        position: 1,
      });
      expect(positions[1]).toEqual({
        id: 2,
        name: "Artist 2",
        score: 80,
        position: 2,
      });
      expect(positions[2]).toEqual({
        id: 3,
        name: "Artist 3",
        score: 70,
        position: 3,
      });
      expect(positions[3]).toEqual({
        id: 4,
        name: "Artist 4",
        score: 60,
        position: 4,
      });
    });

    test("should handle tied scores correctly", () => {
      const artists = [
        { id: 1, name: "Artist 1", score: 90 },
        { id: 2, name: "Artist 2", score: 80 },
        { id: 3, name: "Artist 3", score: 80 }, // Tied with Artist 2
        { id: 4, name: "Artist 4", score: 70 },
      ];

      const positions = calculateLeaderboardPositions(artists);

      expect(positions).toHaveLength(4);
      expect(positions[0]).toEqual({
        id: 1,
        name: "Artist 1",
        score: 90,
        position: 1,
      });
      expect(positions[1]).toEqual({
        id: 2,
        name: "Artist 2",
        score: 80,
        position: 2,
      });
      expect(positions[2]).toEqual({
        id: 3,
        name: "Artist 3",
        score: 80,
        position: 2,
      }); // Same position
      expect(positions[3]).toEqual({
        id: 4,
        name: "Artist 4",
        score: 70,
        position: 4,
      });
    });

    test("should handle multiple ties", () => {
      const artists = [
        { id: 1, name: "Artist 1", score: 90 },
        { id: 2, name: "Artist 2", score: 80 },
        { id: 3, name: "Artist 3", score: 80 }, // Tied with Artist 2
        { id: 4, name: "Artist 4", score: 80 }, // Tied with Artist 2 and 3
        { id: 5, name: "Artist 5", score: 70 },
      ];

      const positions = calculateLeaderboardPositions(artists);

      expect(positions).toHaveLength(5);
      expect(positions[0]).toEqual({
        id: 1,
        name: "Artist 1",
        score: 90,
        position: 1,
      });
      expect(positions[1]).toEqual({
        id: 2,
        name: "Artist 2",
        score: 80,
        position: 2,
      });
      expect(positions[2]).toEqual({
        id: 3,
        name: "Artist 3",
        score: 80,
        position: 2,
      });
      expect(positions[3]).toEqual({
        id: 4,
        name: "Artist 4",
        score: 80,
        position: 2,
      });
      expect(positions[4]).toEqual({
        id: 5,
        name: "Artist 5",
        score: 70,
        position: 5,
      });
    });

    test("should handle empty array", () => {
      const positions = calculateLeaderboardPositions([]);
      expect(positions).toHaveLength(0);
    });

    test("should handle single artist", () => {
      const artists = [{ id: 1, name: "Artist 1", score: 90 }];
      const positions = calculateLeaderboardPositions(artists);

      expect(positions).toHaveLength(1);
      expect(positions[0]).toEqual({
        id: 1,
        name: "Artist 1",
        score: 90,
        position: 1,
      });
    });
  });
});

// Helper function to create mock albums
function createMockAlbum(
  finalScore: number,
  releaseYear: number,
  affectsArtistScore: boolean
): ReviewedAlbum {
  return {
    id: Math.random(),
    spotifyID: `album_${Math.random()}`,
    name: `Album ${Math.random()}`,
    artistName: "Test Artist",
    artistSpotifyID: "artist_123",
    releaseYear,
    releaseDate: `${releaseYear}-01-01`,
    imageURLs: [],
    finalScore,
    reviewScore: finalScore,
    reviewBonuses: {
      perfectBonus: 0,
      qualityBonus: 0,
      consistencyBonus: 0,
      noWeakBonus: 0,
      terriblePenalty: 0,
      poorQualityPenalty: 0,
      noStrongPenalty: 0,
      totalBonus: 0,
    },
    runtime: "30:00",
    affectsArtistScore,
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewCount: 1,
    averageScore: finalScore,
    totalScore: finalScore,
    bestSong: "1",
    worstSong: "2",
    reviewContent: "Test review",
    colors: [],
    genres: [],
    tracks: [],
  } as ReviewedAlbum;
}
