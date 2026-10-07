import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";

import type { HomeOverview } from "@shared/types";

async function seedAlbum(spotifyID: string, createdAt: Date) {
  await AlbumModel.createAlbum({
    spotifyID,
    name: `Album ${spotifyID}`,
    artistSpotifyID: "artist1",
    artistName: "Artist 1",
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [{ url: `${spotifyID}.jpg`, width: 300, height: 300 }],
    runtime: "00:00",
    reviewContent: "",
    reviewScore: 80,
    finalScore: 82,
    affectsArtistScore: true,
    colors: [{ hex: "#336699" }],
    genres: [],
    createdAt,
  });
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
  await ArtistModel.createArtist({
    spotifyID: "artist1",
    name: "Artist 1",
    imageURLs: [],
    headerImage: null,
    averageScore: 82,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: 82,
    reviewCount: 3,
    unrated: false,
    leaderboardPosition: null,
  });
  // The newest review is seeded in the middle, so insert order can't pass for it
  await seedAlbum("old", new Date("2024-01-01"));
  await seedAlbum("newest", new Date("2026-01-01"));
  await seedAlbum("middle", new Date("2025-01-01"));

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
