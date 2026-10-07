import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";

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

test("finds which of the given albums are bookmarked", async () => {
  await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);

  expect(await BookmarkedAlbumModel.getBookmarkedByIds(["1", "2"])).toEqual(["1"]);
});

test("a search counts only the bookmarks it matches", async () => {
  await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);
  await api.post("/api/bookmarks/2/add", { ...mockAlbum, spotifyID: "2", name: "Other Record", artistName: "Someone Else" }, authCookie);

  const res = await api.get("/api/bookmarks?search=other", authCookie);
  const body = await res.json();
  expect(body.albums.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["2"]);
  expect(body.totalCount).toBe(1);
});

test("remove bookmarked album", async () => {
  await api.post("/api/bookmarks/1/add", mockAlbum, authCookie);

  const del = await api.delete("/api/bookmarks/1/remove", authCookie);
  expect(del.status).toBe(204);
});
