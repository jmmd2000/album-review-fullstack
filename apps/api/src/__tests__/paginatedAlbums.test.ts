import { beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";
import { PAGE_SIZE } from "@shared/constants";

import { db, closeDatabase, query } from "@/db/client";
import { reviewedAlbums, reviewedArtists } from "../db/schema";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const authCookie = adminCookie();

// Inserts `count` bare album rows directly (plus one artist to satisfy the
// foreign key), so pagination and search can be exercised without doing the
// full review-create flow for every row. Scores descend so the default
// finalScore ordering is deterministic.
async function seedAlbums(count: number, overrides: (index: number) => Partial<typeof reviewedAlbums.$inferInsert> = () => ({})) {
  await db.insert(reviewedArtists).values({ name: "Seed Artist", spotifyID: "seed-artist", imageURLs: [], averageScore: 0 }).onConflictDoNothing();

  const rows: (typeof reviewedAlbums.$inferInsert)[] = Array.from({ length: count }, (_, index) => ({
    artistSpotifyID: "seed-artist",
    artistName: "Seed Artist",
    name: `Album ${String(index + 1).padStart(3, "0")}`,
    spotifyID: `seed-album-${index + 1}`,
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    bestSong: "Best",
    worstSong: "Worst",
    runtime: "40:00",
    reviewScore: 80,
    finalScore: 100 - index,
    colors: [],
    genres: [],
    ...overrides(index),
  }));

  await db.insert(reviewedAlbums).values(rows);
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

test("search alone matches the album name", async () => {
  await seedAlbums(3, index => ({
    name: ["Midnight Rockers", "Sunrise Boulevard", "Open Highway"][index],
    spotifyID: `search-name-${index}`,
  }));

  const res = await api.get(`/api/albums?search=${encodeURIComponent("Midnight")}`, authCookie);
  expect(res.status).toBe(200);

  const body = await res.json();
  expect(body.albums).toHaveLength(1);
  expect(body.albums[0].spotifyID).toBe("search-name-0");
  expect(body.totalCount).toBe(1);
});

test("search alone matches the artist name", async () => {
  await seedAlbums(2, index => ({
    artistName: ["Radiohead", "Oasis"][index],
    name: `Record ${index}`,
    spotifyID: `search-artist-${index}`,
  }));

  const res = await api.get(`/api/albums?search=${encodeURIComponent("Radiohead")}`, authCookie);
  expect(res.status).toBe(200);

  const body = await res.json();
  expect(body.albums).toHaveLength(1);
  expect(body.albums[0].spotifyID).toBe("search-artist-0");
  expect(body.totalCount).toBe(1);
});

test("pagination exposes furtherPages and correct page boundaries", async () => {
  await seedAlbums(PAGE_SIZE + 1);

  const pageOneRes = await api.get("/api/albums?page=1", authCookie);
  expect(pageOneRes.status).toBe(200);
  const pageOne = await pageOneRes.json();
  expect(pageOne.albums).toHaveLength(PAGE_SIZE);
  expect(pageOne.furtherPages).toBe(true);
  expect(pageOne.totalCount).toBe(PAGE_SIZE + 1);

  const pageTwo = await (await api.get("/api/albums?page=2", authCookie)).json();
  expect(pageTwo.albums).toHaveLength(1);
  expect(pageTwo.furtherPages).toBe(false);
  expect(pageTwo.totalCount).toBe(PAGE_SIZE + 1);
});
