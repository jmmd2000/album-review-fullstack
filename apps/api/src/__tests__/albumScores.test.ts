import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";

async function seedAlbum(spotifyID: string, name: string, reviewScore: number, finalScore: number) {
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
    finalScore,
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
  await seedAlbum("album1", "Album 1", 93, 95);
  await seedAlbum("album2", "Album 2", 47, 45);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("gives the final scores of the reviewed albums, not their base scores", async () => {
  const scores = await AlbumModel.getFinalScoresByIds(["album1", "album2"]);

  expect(scores).toHaveLength(2);
  expect(scores).toEqual(
    expect.arrayContaining([
      { spotifyID: "album1", finalScore: 95 },
      { spotifyID: "album2", finalScore: 45 },
    ])
  );
});

test("leaves out albums that aren't reviewed", async () => {
  expect(await AlbumModel.getFinalScoresByIds(["album1", "nope"])).toEqual([{ spotifyID: "album1", finalScore: 95 }]);
});
