import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const mockAlbum = {
  spotifyID: "1",
  name: "Album",
  artistName: "Artist",
  artistSpotifyID: "a1",
  releaseYear: 2020,
  imageURLs: [],
  finalScore: null,
  affectsArtistScore: false,
};

const authCookie = adminCookie();

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("bookmark album and fetch", async () => {
  const add = await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);
  expect(add.status).toBe(201);

  const fetched = await api.get("/api/bookmarks/1", authCookie);
  expect(fetched.status).toBe(200);
  expect(await fetched.json()).toHaveProperty("spotifyID", "1");
});

test("bookmark statuses", async () => {
  await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);

  const statusRes = await api.get("/api/bookmarks/status?ids=1,2", authCookie);
  expect(statusRes.status).toBe(200);
  expect(await statusRes.json()).toEqual({ "1": true, "2": false });
});

test("remove bookmarked album", async () => {
  await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);

  const del = await api.delete("/api/bookmarks/1/remove", authCookie);
  expect(del.status).toBe(204);
});
