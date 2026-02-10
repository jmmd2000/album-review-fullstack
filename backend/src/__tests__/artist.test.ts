import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { ReviewedArtist } from "@shared/types";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

let authCookie: string[];
const artistID = mockReviewData.album.artists[0].id;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD! });
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

test("GET /api/artists/all - should return all artist reviews", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const response = await request(app).get("/api/artists/all");
  const returnedData: ReviewedArtist[] = response.body;

  expect(response.status).toBe(200);
  expect(returnedData.length).toBe(1);
  expect(returnedData[0]).toHaveProperty("spotifyID", artistID);
});

test("GET /api/artists/:artistID - should return an artist", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const response = await request(app).get(`/api/artists/${artistID}`);
  expect(response.status).toBe(200);

  const artist: ReviewedArtist = response.body;
  expect(artist).toHaveProperty("spotifyID", artistID);
  expect(artist).toHaveProperty("name");
});

test("GET /api/artists/details/:artistID - should return artist details", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const response = await request(app).get(`/api/artists/details/${artistID}`);
  expect(response.status).toBe(200);

  expect(response.body).toHaveProperty("artist");
  expect(response.body).toHaveProperty("albums");
  expect(response.body).toHaveProperty("tracks");
});
