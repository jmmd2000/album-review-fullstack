import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";

import type { HomeOverview, HomeSearchResult } from "@shared/types";

interface SeedArtist {
  spotifyID: string;
  name: string;
  totalScore?: number;
  unrated?: boolean;
}

interface SeedAlbum {
  spotifyID: string;
  name?: string;
  artist?: SeedArtist;
  finalScore?: number;
  createdAt?: Date;
}

const artist1: SeedArtist = { spotifyID: "artist1", name: "Artist 1" };

async function seedArtist({ spotifyID, name, totalScore = 82, unrated = false }: SeedArtist) {
  await ArtistModel.createArtist({
    spotifyID,
    name,
    imageURLs: [],
    headerImage: null,
    totalScore,
    reviewCount: 3,
    unrated,
    leaderboardPosition: null,
  });
}

async function seedAlbum({ spotifyID, name = `Album ${spotifyID}`, artist = artist1, finalScore = 82, createdAt = new Date("2025-01-01") }: SeedAlbum) {
  await AlbumModel.createAlbum({
    spotifyID,
    name,
    artistSpotifyID: artist.spotifyID,
    artistName: artist.name,
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [{ url: `${spotifyID}.jpg`, width: 300, height: 300 }],
    runtime: "00:00",
    reviewContent: "",
    reviewScore: 80,
    finalScore,
    affectsArtistScore: true,
    colors: [{ hex: "#336699" }],
    genres: [],
    createdAt,
  });
}

async function search(text: string): Promise<HomeSearchResult[]> {
  const res = await api.get(`/api/home/search?query=${encodeURIComponent(text)}`);
  expect(res.status).toBe(200);
  return res.json();
}

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("gives a sample of the albums, the newest review and the totals", async () => {
  await seedArtist(artist1);
  // The newest review is seeded in the middle, so insert order can't pass for it
  await seedAlbum({ spotifyID: "old", createdAt: new Date("2024-01-01") });
  await seedAlbum({ spotifyID: "newest", createdAt: new Date("2026-01-01") });
  await seedAlbum({ spotifyID: "middle", createdAt: new Date("2025-01-01") });

  const res = await api.get("/api/home");
  expect(res.status).toBe(200);
  const home: HomeOverview = await res.json();

  expect(home.albums.map(album => album.spotifyID).sort()).toEqual(["middle", "newest", "old"]);
  expect(home.albums[0]).toMatchObject({ finalScore: 82, colors: [{ hex: "#336699" }] });
  expect(home.latestAlbumID).toBe("newest");
  expect(home.albumCount).toBe(3);
  expect(home.artistCount).toBe(1);
});

test("a site with no reviews has no latest review", async () => {
  const home: HomeOverview = await (await api.get("/api/home")).json();

  expect(home).toEqual({ albums: [], latestAlbumID: null, albumCount: 0, artistCount: 0 });
});

test("search shows two artists at most when albums can fill the rest, names that start with the search first", async () => {
  const radiohead: SeedArtist = { spotifyID: "radiohead", name: "Radiohead", totalScore: 90 };
  await seedArtist(artist1);
  await seedArtist(radiohead);
  await seedArtist({ spotifyID: "radiator", name: "Radiator", totalScore: 70 });
  await seedArtist({ spotifyID: "radio-dept", name: "The Radio Dept.", totalScore: 95 });
  await seedAlbum({ spotifyID: "radio-city", name: "Radio City", finalScore: 60 });
  await seedAlbum({ spotifyID: "radiant", name: "Radiant", finalScore: 50 });
  await seedAlbum({ spotifyID: "kid-a", name: "Kid A", artist: radiohead, finalScore: 95 });
  await seedAlbum({ spotifyID: "hail", name: "Hail to the Thief", artist: radiohead, finalScore: 88 });

  const results = await search("radi");

  expect(results.map(result => `${result.type} ${result.name}`)).toEqual(["artist Radiohead", "artist Radiator", "album Radio City", "album Radiant", "album Kid A"]);
  expect(results[4]).toMatchObject({ artistName: "Radiohead", releaseYear: 2020, score: 95 });
});

test("search fills the rows with more artists when albums run short", async () => {
  await seedArtist(artist1);
  await seedArtist({ spotifyID: "radiohead", name: "Radiohead", totalScore: 90 });
  await seedArtist({ spotifyID: "radiator", name: "Radiator", totalScore: 0, unrated: true });
  await seedArtist({ spotifyID: "radio-dept", name: "The Radio Dept.", totalScore: 95 });
  await seedAlbum({ spotifyID: "radio-city", name: "Radio City" });

  const results = await search("RADI");

  expect(results.map(result => result.name)).toEqual(["Radiohead", "Radiator", "The Radio Dept.", "Radio City"]);
  expect(results[1]).toMatchObject({ type: "artist", albumCount: 3, score: null });
});

test("search refuses a blank query", async () => {
  const res = await api.get("/api/home/search?query=%20%20");

  expect(res.status).toBe(400);
});
