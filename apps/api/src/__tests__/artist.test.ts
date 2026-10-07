import { closeDatabase, db, query } from "@/db/client";
import { reviewedArtists } from "@/db/schema";
import { mockReviewData } from "./constants";
import { resetTables } from "./testUtils";
import type { DisplayTrack, ReviewedArtist } from "@shared/types";
import { beforeEach, afterEach, afterAll, test, expect, vi } from "vitest";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

// Stops the tests from starting the Puppeteer browser that fetches header images
vi.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: vi.fn(() => Promise.resolve(null)),
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

test("artist details give each track the name of its album", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const body = await (await api.get(`/api/artists/details/${artistID}`)).json();
  expect(body.tracks.length).toBeGreaterThan(0);
  expect(body.tracks.every((track: DisplayTrack) => track.albumName === mockReviewData.album.name)).toBe(true);
});

test("artist details count only rated artists as ranked", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);
  await db.insert(reviewedArtists).values({ name: "Unrated Artist", spotifyID: "unrated-artist", imageURLs: [], unrated: true });

  const body = await (await api.get(`/api/artists/details/${artistID}`)).json();
  expect(body.rankedArtistCount).toBe(1);
});

test("artist details list tracks newest album first, each album in album order", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  // A newer album with its own track IDs, created second so the save order isn't the release order
  const newerTrackID = (id: string) => `${id}-newer`;
  const newerAlbum = {
    ...mockReviewData,
    album: {
      ...mockReviewData.album,
      id: "7fRrTyKvE4Skh93v97gtcU",
      name: "Newer Album",
      release_date: "2024-05-17",
      tracks: { ...mockReviewData.album.tracks, items: mockReviewData.album.tracks.items.map(item => ({ ...item, id: newerTrackID(item.id) })) },
    },
    ratedTracks: mockReviewData.ratedTracks.map(track => ({ ...track, spotifyID: newerTrackID(track.spotifyID) })),
  };
  const create = await api.post("/api/albums/create", newerAlbum, authCookie);
  expect(create.status).toBe(201);

  const body = await (await api.get(`/api/artists/details/${artistID}`)).json();
  const expected = [...newerAlbum.ratedTracks, ...mockReviewData.ratedTracks].map(track => track.spotifyID);
  expect(body.tracks.map((track: DisplayTrack) => track.spotifyID)).toEqual(expected);
});
