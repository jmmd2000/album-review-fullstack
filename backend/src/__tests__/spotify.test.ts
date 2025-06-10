import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayAlbum, SpotifyAlbum } from "@shared/types";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";

jest.mock("../api/services/spotifyService", () => ({
  SpotifyService: {
    getAccessToken: jest.fn(() => Promise.resolve("mock_token")),
    searchAlbums: jest.fn(() =>
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
    getAlbum: jest.fn(() => Promise.resolve(mockReviewData.album)),
  },
}));

let authCookie: string[];

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD ?? "123" });
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

test("GET /api/spotify/token - Should return token", async () => {
  const response = await request(app).get("/api/spotify/token");
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ token: "mock_token" });
});

test("GET /api/spotify/albums/search?query=abba - Should return albums", async () => {
  const response = await request(app).get("/api/spotify/albums/search?query=abba");
  expect(response.status).toBe(200);
  const data: DisplayAlbum[] = response.body;
  expect(Array.isArray(data)).toBe(true);
  expect(data[0]).toHaveProperty("name");
  expect(data[0]).toHaveProperty("spotifyID");
});

test("GET /api/spotify/albums/:albumID - Should return album", async () => {
  const response = await request(app).get("/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=false");
  expect(response.status).toBe(200);
  const data: SpotifyAlbum = response.body;
  expect(data).toHaveProperty("id", mockReviewData.album.id);
  expect(data).toHaveProperty("name", mockReviewData.album.name);
});
