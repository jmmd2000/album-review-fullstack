import { closeDatabase, query } from "@/db/client";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { ReviewedArtist } from "@shared/types";
import { beforeEach, afterEach, afterAll, test, expect, jest } from "@jest/globals";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

const authCookie = adminCookie();
const artistID = mockReviewData.album.artists[0].id;

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("GET /api/artists/all - should return all artist reviews", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const response = await api.get("/api/artists/all");
  expect(response.status).toBe(200);

  const returnedData: ReviewedArtist[] = await response.json();
  expect(returnedData.length).toBe(1);
  expect(returnedData[0]).toHaveProperty("spotifyID", artistID);
});

test("GET /api/artists/:artistID - should return an artist", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const response = await api.get(`/api/artists/${artistID}`);
  expect(response.status).toBe(200);

  const artist: ReviewedArtist = await response.json();
  expect(artist).toHaveProperty("spotifyID", artistID);
  expect(artist).toHaveProperty("name");
});

test("GET /api/artists/details/:artistID - should return artist details", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const response = await api.get(`/api/artists/details/${artistID}`);
  expect(response.status).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty("artist");
  expect(body).toHaveProperty("albums");
  expect(body).toHaveProperty("tracks");
});

test("POST /api/artists/headerImage - returns 404 for an unknown artist", async () => {
  const res = await api.post("/api/artists/headerImage?spotifyID=thisIdDoesNotExist", undefined, authCookie);
  expect(res.status).toBe(404);
});

test("POST /api/artists/profileImage - returns 404 for an unknown artist", async () => {
  const res = await api.post("/api/artists/profileImage?spotifyID=thisIdDoesNotExist", undefined, authCookie);
  expect(res.status).toBe(404);
});
