import request from "supertest";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";
import { PAGE_SIZE } from "@shared/constants";

import { app, db } from "../index";
import { reviewedAlbums, reviewedArtists } from "../db/schema";
import { closeDatabase, query } from "../../db";
import { resetTables } from "./testUtils";

let authCookie: string[];

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

beforeAll(async () => {
  const res = await request(app).post("/api/auth/login").send({ password: process.env.ADMIN_PASSWORD! });
  expect(res.status).toBe(204);
  const setCookie = res.get("set-cookie");
  authCookie = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
});

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await request(app).post("/api/auth/logout").set("Cookie", authCookie).send();
  await closeDatabase();
});

test("search alone matches the album name", async () => {
  await seedAlbums(3, index => ({
    name: ["Midnight Rockers", "Sunrise Boulevard", "Open Highway"][index],
    spotifyID: `search-name-${index}`,
  }));

  const res = await request(app)
    .get(`/api/albums?search=${encodeURIComponent("Midnight")}`)
    .set("Cookie", authCookie);

  expect(res.status).toBe(200);
  expect(res.body.albums).toHaveLength(1);
  expect(res.body.albums[0].spotifyID).toBe("search-name-0");
  expect(res.body.totalCount).toBe(1);
});

test("search alone matches the artist name", async () => {
  await seedAlbums(2, index => ({
    artistName: ["Radiohead", "Oasis"][index],
    name: `Record ${index}`,
    spotifyID: `search-artist-${index}`,
  }));

  const res = await request(app)
    .get(`/api/albums?search=${encodeURIComponent("Radiohead")}`)
    .set("Cookie", authCookie);

  expect(res.status).toBe(200);
  expect(res.body.albums).toHaveLength(1);
  expect(res.body.albums[0].spotifyID).toBe("search-artist-0");
  expect(res.body.totalCount).toBe(1);
});

test("pagination exposes furtherPages and correct page boundaries", async () => {
  await seedAlbums(PAGE_SIZE + 1);

  const pageOne = await request(app).get("/api/albums?page=1").set("Cookie", authCookie);
  expect(pageOne.status).toBe(200);
  expect(pageOne.body.albums).toHaveLength(PAGE_SIZE);
  expect(pageOne.body.furtherPages).toBe(true);
  expect(pageOne.body.totalCount).toBe(PAGE_SIZE + 1);

  const pageTwo = await request(app).get("/api/albums?page=2").set("Cookie", authCookie);
  expect(pageTwo.body.albums).toHaveLength(1);
  expect(pageTwo.body.furtherPages).toBe(false);
  expect(pageTwo.body.totalCount).toBe(PAGE_SIZE + 1);
});
