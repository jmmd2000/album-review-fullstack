import { closeDatabase, query } from "@/db/client";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayAlbum, SpotifyAlbum } from "@shared/types";
import { beforeEach, afterEach, afterAll, test, expect, vi } from "vitest";
import { api } from "./apiRequest";

// Async factory so the mock can import its fixture without fighting vi.mock hoisting
vi.mock("../api/services/SpotifyService", async () => {
  const { mockReviewData } = await import("./constants");
  return {
    SpotifyService: {
      getAccessToken: vi.fn(() => Promise.resolve("mock_token")),
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

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("GET /api/spotify/token - Should return token", async () => {
  const response = await api.get("/api/spotify/token");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ token: "mock_token" });
});

test("GET /api/spotify/albums/search?query=abba - Should return albums", async () => {
  const response = await api.get("/api/spotify/albums/search?query=abba");
  expect(response.status).toBe(200);
  const data: DisplayAlbum[] = await response.json();
  expect(Array.isArray(data)).toBe(true);
  expect(data[0]).toHaveProperty("name");
  expect(data[0]).toHaveProperty("spotifyID");
});

test("GET /api/spotify/albums/:albumID - Should return album", async () => {
  const response = await api.get("/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=false");
  expect(response.status).toBe(200);
  const data: SpotifyAlbum = await response.json();
  expect(data).toHaveProperty("id", mockReviewData.album.id);
  expect(data).toHaveProperty("name", mockReviewData.album.name);
});
