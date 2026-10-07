import { closeDatabase, query } from "@/db/client";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayAlbum, SpotifyAlbum } from "@shared/types";
import { beforeEach, afterEach, afterAll, test, expect, vi } from "vitest";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { SpotifyService } from "../api/services/SpotifyService";

// Async factory so the mock can import its fixture without fighting vi.mock hoisting
vi.mock("../api/services/SpotifyService", async () => {
  const { mockReviewData } = await import("./constants");
  return {
    SpotifyService: {
      searchAlbums: vi.fn(() =>
        Promise.resolve([
          {
            spotifyID: "1",
            name: "Mock Album",
            artistName: "Mock Artist",
            artistSpotifyID: "artist1",
            releaseYear: 2024,
            imageURLs: [],
          },
        ])
      ),
      getAlbum: vi.fn(() => Promise.resolve(mockReviewData.album)),
    },
  };
});

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

test("spotify routes require admin", async () => {
  for (const path of ["/api/spotify/albums/search?query=abba", "/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n"]) {
    const response = await api.get(path);
    expect(response.status).toBe(401);
  }
});

test("the token route is gone", async () => {
  const response = await api.get("/api/spotify/token", authCookie);
  expect(response.status).toBe(404);
});

test("GET /api/spotify/albums/search?query=abba - Should return albums", async () => {
  const response = await api.get("/api/spotify/albums/search?query=abba", authCookie);
  expect(response.status).toBe(200);
  const data: DisplayAlbum[] = await response.json();
  expect(Array.isArray(data)).toBe(true);
  expect(data[0]).toHaveProperty("name");
  expect(data[0]).toHaveProperty("spotifyID");
});

test("GET /api/spotify/albums/:albumID - Should return album", async () => {
  const response = await api.get("/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=false", authCookie);
  expect(response.status).toBe(200);
  const data: SpotifyAlbum = await response.json();
  expect(data).toHaveProperty("id", mockReviewData.album.id);
  expect(data).toHaveProperty("name", mockReviewData.album.name);
});

test("GET /api/spotify/albums/:albumID - A malformed id gets a 404 and never reaches Spotify", async () => {
  vi.mocked(SpotifyService.getAlbum).mockClear();
  for (const albumID of ["..%2F..%2Fme%3Fx%3D1", "short", "7aJuG4TFXa2hmE4z1yxc3n-"]) {
    const response = await api.get(`/api/spotify/albums/${albumID}`, authCookie);
    expect(response.status).toBe(404);
  }
  expect(SpotifyService.getAlbum).not.toHaveBeenCalled();
});

test("GET /api/spotify/albums/:albumID - includeGenres must be true or false", async () => {
  const response = await api.get("/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=yes", authCookie);
  expect(response.status).toBe(400);
});
