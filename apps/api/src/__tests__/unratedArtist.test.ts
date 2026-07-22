import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { mockReviewData, mockUpdateData } from "./constants";
import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const authCookie = adminCookie();
const artistID = mockReviewData.album.artists[0].id;
const albumID = mockReviewData.album.id;

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("artist flagged unrated until an album affects score", async () => {
  const createRes = await api.post("/api/albums/create", { ...mockReviewData, affectsArtistScore: false }, authCookie);
  expect(createRes.status).toBe(201);
  const created = await createRes.json();

  let artistRes = await api.get(`/api/artists/${artistID}`);
  expect(artistRes.status).toBe(200);
  expect((await artistRes.json()).unrated).toBe(true);

  const updateData = { ...mockUpdateData, album: created, affectsArtistScore: true };
  const updateRes = await api.put(`/api/albums/${albumID}/edit`, updateData, authCookie);
  expect(updateRes.status).toBe(200);

  artistRes = await api.get(`/api/artists/${artistID}`);
  expect((await artistRes.json()).unrated).toBe(false);
});
