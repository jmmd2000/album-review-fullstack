import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";

async function seedAlbum(spotifyID: string, name: string, reviewScore: number) {
  await AlbumModel.createAlbum({
    spotifyID,
    name,
    artistSpotifyID: "artist1",
    artistName: "Artist 1",
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    runtime: "00:00",
    reviewContent: "",
    reviewScore,
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
    finalScore: reviewScore,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
}

beforeEach(async () => {
  await resetTables(query);
  await ArtistModel.createArtist({
    spotifyID: "artist1",
    name: "Artist 1",
    imageURLs: [],
    headerImage: null,
    averageScore: 70,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: 70,
    reviewCount: 2,
    unrated: false,
    leaderboardPosition: null,
  });
  await seedAlbum("album1", "Album 1", 95);
  await seedAlbum("album2", "Album 2", 45);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("returns the review scores for the requested ids", async () => {
  const res = await api.get("/api/albums/scores?ids=album1,album2");
  expect(res.status).toBe(200);

  const scores = await res.json();
  expect(scores).toHaveLength(2);
  expect(scores).toEqual(
    expect.arrayContaining([
      { spotifyID: "album1", reviewScore: 95 },
      { spotifyID: "album2", reviewScore: 45 },
    ])
  );
});

test("a single id works without a comma", async () => {
  const res = await api.get("/api/albums/scores?ids=album1");
  expect(await res.json()).toEqual([{ spotifyID: "album1", reviewScore: 95 }]);
});

test("unknown ids come back empty", async () => {
  const res = await api.get("/api/albums/scores?ids=nope");
  expect(await res.json()).toEqual([]);
});

test("a missing ids parameter is rejected", async () => {
  const res = await api.get("/api/albums/scores");
  expect(res.status).toBe(400);
});
