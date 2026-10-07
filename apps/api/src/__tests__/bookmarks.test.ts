import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";

const mockAlbum = {
  spotifyID: "bookmarkedAlbumNumber1",
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
  const add = await api.post("/api/bookmarks/bookmarkedAlbumNumber1/add", mockAlbum, authCookie);
  expect(add.status).toBe(201);

  const fetched = await api.get("/api/bookmarks/bookmarkedAlbumNumber1", authCookie);
  expect(fetched.status).toBe(200);
  expect(await fetched.json()).toHaveProperty("spotifyID", "bookmarkedAlbumNumber1");
});

test("finds which of the given albums are bookmarked", async () => {
  await api.post("/api/bookmarks/bookmarkedAlbumNumber1/add", mockAlbum, authCookie);

  expect(await BookmarkedAlbumModel.getBookmarkedByIds(["bookmarkedAlbumNumber1", "bookmarkedAlbumNumber2"])).toEqual(["bookmarkedAlbumNumber1"]);
});

test("a search counts only the bookmarks it matches", async () => {
  await api.post("/api/bookmarks/bookmarkedAlbumNumber1/add", mockAlbum, authCookie);
  await api.post("/api/bookmarks/bookmarkedAlbumNumber2/add", { ...mockAlbum, spotifyID: "bookmarkedAlbumNumber2", name: "Other Record", artistName: "Someone Else" }, authCookie);

  const res = await api.get("/api/bookmarks?search=other", authCookie);
  const body = await res.json();
  expect(body.albums.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["bookmarkedAlbumNumber2"]);
  expect(body.totalCount).toBe(1);
});

test("remove bookmarked album", async () => {
  await api.post("/api/bookmarks/bookmarkedAlbumNumber1/add", mockAlbum, authCookie);

  const del = await api.delete("/api/bookmarks/bookmarkedAlbumNumber1/remove", authCookie);
  expect(del.status).toBe(204);
});
