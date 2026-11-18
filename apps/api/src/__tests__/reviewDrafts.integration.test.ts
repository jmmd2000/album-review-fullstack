import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDatabase, query } from "@/db/client";
import { reviewDrafts } from "@/db/schema";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { ReviewDraftService } from "@/api/services/ReviewDraftService";

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

const draftSave = {
  formValues: {
    tracks: [{ spotifyID: "track-1", artistSpotifyID: "artist-1", artistName: "Artist", name: "Track", duration: 200000, rating: 7, pick: null, features: [] }],
    reviewContent: "Half written",
    bonus: 1,
    colours: [{ hex: "#112233" }],
    genres: ["dub"],
    affectsArtistScore: true,
    creditedArtistIDs: ["artist-1"],
    scoreArtistIDs: ["artist-1"],
  },
  album: { name: "Album", artistName: "Artist", artistSpotifyID: "artist-1", releaseYear: 2020, imageURLs: [] },
};

test("a saved draft loads back with its values", async () => {
  const res = await api.put(`/api/drafts/${albumID}`, draftSave, authCookie);
  expect(res.status).toBe(204);

  const draft = await ReviewDraftService.getDraft(albumID);
  expect(draft?.formValues).toEqual(draftSave.formValues);
});

test("a stored draft that no longer matches the form loads as unreadable", async () => {
  await saveDraft(albumID);

  const draft = await ReviewDraftService.getDraft(albumID);

  expect(draft).not.toBeNull();
  expect(draft?.formValues).toBeNull();
});

test("a draft save for an album that's already reviewed is refused", async () => {
  expect((await api.post("/api/albums/create", mockReviewData, authCookie)).status).toBe(201);

  const res = await api.put(`/api/drafts/${albumID}`, draftSave, authCookie);

  expect(res.status).toBe(409);
  expect(await draftExists(albumID)).toBe(false);
});
