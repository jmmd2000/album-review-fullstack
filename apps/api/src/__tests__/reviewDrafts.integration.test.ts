import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDatabase, query } from "@/db/client";
import { reviewDrafts } from "@/db/schema";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const authCookie = adminCookie();
const albumID = mockReviewData.album.id;

async function saveDraft(spotifyID: string) {
  await db.insert(reviewDrafts).values({
    spotifyID,
    name: mockReviewData.album.name,
    artistName: mockReviewData.album.artists[0].name,
    artistSpotifyID: mockReviewData.album.artists[0].id,
    releaseYear: 2020,
    imageURLs: [],
    formValues: { reviewContent: "Half written" },
  });
}

async function draftExists(spotifyID: string) {
  const rows = await db.select().from(reviewDrafts).where(eq(reviewDrafts.spotifyID, spotifyID));
  return rows.length > 0;
}

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("saving a review removes its draft", async () => {
  await saveDraft(albumID);

  const res = await api.post("/api/albums/create", mockReviewData, authCookie);
  expect(res.status).toBe(201);

  expect(await draftExists(albumID)).toBe(false);
});

test("deleting a review removes its draft", async () => {
  expect((await api.post("/api/albums/create", mockReviewData, authCookie)).status).toBe(201);
  await saveDraft(albumID);

  const res = await api.delete(`/api/albums/${albumID}`, authCookie);
  expect(res.status).toBe(204);

  expect(await draftExists(albumID)).toBe(false);
});

test("saving a review leaves other albums' drafts alone", async () => {
  await saveDraft("another-album");

  expect((await api.post("/api/albums/create", mockReviewData, authCookie)).status).toBe(201);

  expect(await draftExists("another-album")).toBe(true);
});
