import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { PAGE_SIZE } from "@shared/constants";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";

const authCookie = adminCookie();
const TOTAL = PAGE_SIZE + 5;

beforeEach(async () => {
  await resetTables(query);
  for (let index = 1; index <= TOTAL; index++) {
    await BookmarkedAlbumModel.bookmarkAlbum({
      spotifyID: `bm${index}`,
      name: `Album ${String(index).padStart(2, "0")}`,
      artistName: index % 2 === 0 ? "Alpha Artist" : "Beta Artist",
      artistSpotifyID: index % 2 === 0 ? "alpha" : "beta",
      releaseYear: 2000 + index,
      imageURLs: [],
    });
  }
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("page one is a full page and signals further pages", async () => {
  const res = await api.get("/api/bookmarks?page=1", authCookie);
  expect(res.status).toBe(200);

  const body = await res.json();
  expect(body.albums).toHaveLength(PAGE_SIZE);
  expect(body.furtherPages).toBe(true);
  expect(body.totalCount).toBe(TOTAL);
});

test("the last page returns the remainder and no further pages", async () => {
  const body = await (await api.get("/api/bookmarks?page=2", authCookie)).json();
  expect(body.albums).toHaveLength(TOTAL - PAGE_SIZE);
  expect(body.furtherPages).toBe(false);
});

test("search matches album and artist names", async () => {
  const byAlbum = await (await api.get("/api/bookmarks?search=Album 04", authCookie)).json();
  expect(byAlbum.albums).toHaveLength(1);
  expect(byAlbum.albums[0].spotifyID).toBe("bm4");

  const byArtist = await (await api.get("/api/bookmarks?search=Alpha", authCookie)).json();
  expect(byArtist.albums.length).toBeGreaterThan(0);
  for (const album of byArtist.albums) {
    expect(album.artistName).toBe("Alpha Artist");
  }
});

test("results order by name in both directions", async () => {
  const ascending = await (await api.get("/api/bookmarks?orderBy=name&order=asc", authCookie)).json();
  expect(ascending.albums[0].name).toBe("Album 01");

  const descending = await (await api.get("/api/bookmarks?orderBy=name&order=desc", authCookie)).json();
  expect(descending.albums[0].name).toBe(`Album ${TOTAL}`);
});

test("an unknown orderBy is rejected", async () => {
  const res = await api.get("/api/bookmarks?orderBy=bogus", authCookie);
  expect(res.status).toBe(400);
});

test("the paginated list requires admin", async () => {
  const res = await api.get("/api/bookmarks");
  expect(res.status).toBe(401);
});
