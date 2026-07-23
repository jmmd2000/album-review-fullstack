import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { getAllGenres } from "@/helpers/getAllGenres";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";

async function seedAlbum(spotifyID: string, genres: string[]) {
  await AlbumModel.createAlbum({
    spotifyID,
    name: spotifyID,
    artistSpotifyID: "artist1",
    artistName: "Artist 1",
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    bestSong: "1",
    worstSong: "1",
    runtime: "00:00",
    reviewContent: "",
    reviewScore: 80,
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
    finalScore: 80,
    affectsArtistScore: true,
    colors: [],
    genres,
  });
}

beforeEach(async () => {
  await resetTables(query);
  await ArtistModel.createArtist({
    spotifyID: "artist1",
    name: "Artist 1",
    imageURLs: [],
    headerImage: null,
    averageScore: 80,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: 80,
    reviewCount: 2,
    unrated: false,
    leaderboardPosition: null,
  });
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("flattens, dedupes and sorts the genres across albums", async () => {
  await seedAlbum("album1", ["rock", "pop"]);
  await seedAlbum("album2", ["pop", "", "ambient"]);

  expect(await getAllGenres()).toEqual(["ambient", "pop", "rock"]);
});

test("returns empty when nothing is reviewed", async () => {
  expect(await getAllGenres()).toEqual([]);
});
