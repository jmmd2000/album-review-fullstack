import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayTrack } from "@shared/types";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

let authCookie: string[];

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

test("GET /api/tracks/:albumID - should return album tracks", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const response = await request(app).get("/api/tracks/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);

  expect(response.status).toBe(200);
  const tracks: DisplayTrack[] = response.body;
  expect(Array.isArray(tracks)).toBe(true);
  expect(tracks[0]).toHaveProperty("spotifyID");
  expect(tracks[0]).toHaveProperty("name");
});

test("DELETE /api/tracks/:albumID - should delete album tracks", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const delRes = await request(app).delete("/api/tracks/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);
  expect(delRes.status).toBe(204);

  const response = await request(app).get("/api/tracks/0JGOiO34nwfUdDrD612dOp").set("Cookie", authCookie);
  const tracks: DisplayTrack[] = response.body;
  expect(tracks.length).toBe(0);
});
