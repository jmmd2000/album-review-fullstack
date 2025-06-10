import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { mockReviewData, mockUpdateData } from "./constants";
import type { DisplayAlbum, ReviewedAlbum, ReviewedArtist, ReviewedTrack } from "@shared/types";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";
import { resetTables } from "./testUtils";

// Mock Puppeteer header fetcher
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

let authCookie: string[];

// Suppress duplicate-key console errors during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

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

test("POST /api/albums/create - should create a new album review", async () => {
  const response = await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
});

test("GET /api/albums/:albumID - should return a review for a given album", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const response = await request(app).get("/api/albums/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);
  expect(response.status).toBe(200);

  const returned: {
    album: ReviewedAlbum;
    artist: ReviewedArtist;
    tracks: ReviewedTrack[];
  } = response.body;

  expect(returned.album).toHaveProperty("spotifyID");
  expect(returned.album).toHaveProperty("name");
  expect(returned.artist).toHaveProperty("averageScore");
  expect(returned.tracks[0]).toHaveProperty("rating");
});

test("GET /api/albums - should return all album reviews", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);
  await request(app)
    .post("/api/albums/create")
    .set("Cookie", authCookie)
    .send({
      ...mockReviewData,
      album: { ...mockReviewData.album, id: "7fRrTyKvE4Skh93v97gtcU" },
    });

  const response = await request(app).get("/api/albums").set("Cookie", authCookie);
  expect(response.status).toBe(200);

  const { albums }: { albums: DisplayAlbum[] } = response.body;
  expect(albums[0]).toHaveProperty("spotifyID");
  expect(Array.isArray(albums[0].imageURLs)).toBe(true);
});

test("PUT /api/albums/:albumID/edit - should update album review", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const created = await request(app).get("/api/albums/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);
  mockUpdateData.album = created.body.album;

  const updateRes = await request(app).put("/api/albums/0JGOiO34nwfUdDrD612dOp/edit").set("Cookie", authCookie).send(mockUpdateData);

  expect(updateRes.status).toBe(200);

  const updated = await request(app).get("/api/albums/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);
  expect(updated.body.album.reviewScore).toBe(90);
  expect(updated.body.album.reviewContent).toBe(mockUpdateData.reviewContent);
}, 15000);
