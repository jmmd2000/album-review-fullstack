import { closeDatabase, query } from "@/db/client";
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

  const res = await api.get("/api/albums", authCookie);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.genres.length).toBe(0);
});

test("genre filter is kept when a search term is also present", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  await api.post(
    "/api/albums/create",
    {
      ...mockReviewData,
      album: { ...mockReviewData.album, id: "7fRrTyKvE4Skh93v97gtcU", name: "Midnight Rockers" },
      genres: ["rock"],
    },
    authCookie
  );

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
