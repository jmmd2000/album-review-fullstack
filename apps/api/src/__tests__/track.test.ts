import { closeDatabase, query } from "@/db/client";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayTrack } from "@shared/types";
import { beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

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

test("GET /api/tracks/:albumID - should return album tracks", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const response = await api.get("/api/tracks/0JGOiO34nwfUdDrD612dOp", authCookie);
  expect(response.status).toBe(200);

  const tracks: DisplayTrack[] = await response.json();
  expect(Array.isArray(tracks)).toBe(true);
  expect(tracks[0]).toHaveProperty("spotifyID");
  expect(tracks[0]).toHaveProperty("name");
});

test("DELETE /api/tracks/:albumID - should delete album tracks", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const delRes = await api.delete("/api/tracks/0JGOiO34nwfUdDrD612dOp", authCookie);
  expect(delRes.status).toBe(204);

  const response = await api.get("/api/tracks/0JGOiO34nwfUdDrD612dOp", authCookie);
  const tracks: DisplayTrack[] = await response.json();
  expect(tracks.length).toBe(0);
});
