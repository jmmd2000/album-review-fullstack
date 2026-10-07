import { db, closeDatabase, query } from "@/db/client";
import { genres } from "@/db/schema";
import { mockReviewData, mockUpdateData } from "./constants";
import { resetTables } from "./testUtils";
import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import type { Genre } from "@shared/types";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const authCookie = adminCookie();
const albumID = mockReviewData.album.id;

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

// A second album by the same artist. It has no tracks, because track IDs are unique and the mock's are already taken.
async function createSecondAlbum(genreNames: string[]) {
  const res = await api.post(
    "/api/albums/create",
    { ...mockReviewData, album: { ...mockReviewData.album, id: "7fRrTyKvE4Skh93v97gtcU", name: "Midnight Rockers" }, ratedTracks: [], genres: genreNames },
    authCookie
  );
  expect(res.status).toBe(201);
}

test("album creation stores genres", async () => {
  const create = await api.post("/api/albums/create", mockReviewData, authCookie);
  expect(create.status).toBe(201);

  const res = await api.get(`/api/albums/${albumID}`, authCookie);
  expect(res.status).toBe(200);

  const body = await res.json();
  const albumGenres = (body.albumGenres as Genre[]).map(g => g.name).sort();
  const allGenres = (body.allGenres as Genre[]).map(g => g.name).sort();
  const expected = [...mockReviewData.genres].sort();
  expect(albumGenres).toEqual(expected);
  expect(allGenres).toEqual(expected);
});

test("filter albums by genre", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const res = await api.get(`/api/albums?genres=${encodeURIComponent("pop")}`, authCookie);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.albums.length).toBe(1);
  expect(body.albums[0]).toHaveProperty("spotifyID", albumID);
  expect(body.totalCount).toBe(1);
});

test("filtering by several genres returns albums with any of them, once each", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);
  await createSecondAlbum(["rock"]);

  const either = await (await api.get(`/api/albums?genres=${encodeURIComponent("pop,rock")}`, authCookie)).json();
  expect(either.albums).toHaveLength(2);
  expect(either.totalCount).toBe(2);

  // pop and jazz are both on the first album
  const both = await (await api.get(`/api/albums?genres=${encodeURIComponent("pop,jazz")}`, authCookie)).json();
  expect(both.albums).toHaveLength(1);
  expect(both.totalCount).toBe(1);
});

test("the album list returns each genre with its album count, most common first", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);
  await createSecondAlbum(["pop", "rock"]);

  const body = await (await api.get("/api/albums", authCookie)).json();
  expect(body.genres).toEqual([
    { name: "pop", slug: "pop", albumCount: 2 },
    { name: "hip-hop", slug: "hip-hop", albumCount: 1 },
    { name: "jazz", slug: "jazz", albumCount: 1 },
    { name: "rock", slug: "rock", albumCount: 1 },
  ]);
});

test("updating genres replaces old entries", async () => {
  const create = await api.post("/api/albums/create", mockReviewData, authCookie);
  expect(create.status).toBe(201);

  const current = await (await api.get(`/api/albums/${albumID}`, authCookie)).json();
  const updateData = { ...mockUpdateData, album: current.album };

  const update = await api.put(`/api/albums/${albumID}/edit`, updateData, authCookie);
  expect(update.status).toBe(200);

  const res = await api.get(`/api/albums/${albumID}`, authCookie);
  const body = await res.json();
  const names = (body.albumGenres as Genre[]).map(g => g.name).sort();
  expect(names).toEqual(["genre1", "genre2", "genre3"]);
  const allNames = (body.allGenres as Genre[]).map(g => g.name).sort();
  expect(allNames).toEqual(["genre1", "genre2", "genre3"]);
});

test("deleting album clears unused genres", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const del = await api.delete(`/api/albums/${albumID}`, authCookie);
  expect(del.status).toBe(204);

  // The album list leaves out genres with no albums, so read the table itself
  const rows = await db.select().from(genres);
  expect(rows).toHaveLength(0);
});

test("genre filter is kept when a search term is also present", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);
  await createSecondAlbum(["rock"]);

  const res = await api.get(`/api/albums?genres=${encodeURIComponent("pop")}&search=${encodeURIComponent("Midnight")}`, authCookie);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.albums).toHaveLength(0);
  expect(body.totalCount).toBe(0);

  const popOnly = await (await api.get(`/api/albums?genres=${encodeURIComponent("pop")}`, authCookie)).json();
  expect(popOnly.albums).toHaveLength(1);
  expect(popOnly.albums[0]).toHaveProperty("spotifyID", mockReviewData.album.id);
  expect(popOnly.totalCount).toBe(1);
});
