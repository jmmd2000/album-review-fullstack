import { afterAll, afterEach, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";

const authCookie = adminCookie();

async function seedReviewedAlbum(spotifyID: string, artistSpotifyID: string, finalScore: number) {
  await AlbumModel.createAlbum({
    spotifyID,
    name: spotifyID,
    artistSpotifyID,
    artistName: artistSpotifyID,
    releaseDate: "2024-01-01",
    releaseYear: 2024,
    imageURLs: [],
    runtime: "40 minutes",
    reviewContent: "",
    reviewScore: finalScore,
    bonus: 0,
    finalScore,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
  await AlbumModel.upsertAlbumArtists(spotifyID, [{ artistSpotifyID, affectsScore: true }]);
}

async function seedBookmark(spotifyID: string, artistSpotifyID: string, createdAt: Date) {
  await BookmarkedAlbumModel.bookmarkAlbum({ spotifyID, name: spotifyID, artistSpotifyID, artistName: artistSpotifyID, releaseYear: 2025, imageURLs: [], createdAt });
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

test("the discover rows require admin", async () => {
  const res = await api.get("/api/discover");
  expect(res.status).toBe(401);
});

test("up next puts bookmarks by reviewed artists first, highest average first, then the newest other bookmarks", async () => {
  for (const artist of ["loved", "liked"]) {
    await ArtistModel.createArtist({ spotifyID: artist, name: artist, imageURLs: [], headerImage: null, totalScore: 0, reviewCount: 1, unrated: false, leaderboardPosition: null });
  }
  await seedReviewedAlbum("lovedFirst", "loved", 90);
  await seedReviewedAlbum("lovedSecond", "loved", 70);
  await seedReviewedAlbum("likedOnly", "liked", 60);

  await seedBookmark("byLiked", "liked", new Date("2026-03-01"));
  await seedBookmark("byNewcomerOld", "newcomer", new Date("2026-01-01"));
  await seedBookmark("byLoved", "loved", new Date("2026-02-01"));
  await seedBookmark("byNewcomerNew", "newcomer", new Date("2026-04-01"));

  const res = await api.get("/api/discover", authCookie);
  expect(res.status).toBe(200);
  const { upNext } = await res.json();

  expect(upNext.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["byLoved", "byLiked", "byNewcomerNew", "byNewcomerOld"]);
});

test("up next shows at most 10 bookmarks", async () => {
  for (let index = 0; index < 12; index++) {
    await seedBookmark(`bookmark${index}`, "newcomer", new Date(2026, 0, index + 1));
  }

  const { upNext } = await (await api.get("/api/discover", authCookie)).json();
  expect(upNext).toHaveLength(10);
});
