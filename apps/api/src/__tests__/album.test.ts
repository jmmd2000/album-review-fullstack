import { closeDatabase, query } from "@/db/client";
import { mockReviewData, mockUpdateData } from "./constants";
import type { DisplayAlbum, ReviewedAlbum, ReviewedArtist, ReviewedTrack } from "@shared/types";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect, vi } from "vitest";
import { resetTables } from "./testUtils";
import { ArtistModel } from "../api/models/Artist";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

const authCookie = adminCookie();

// Suppress duplicate-key console errors during tests
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("POST /api/albums/create - should create a new album review", async () => {
  const res = await api.post("/api/albums/create", mockReviewData, authCookie);
  expect(res.status).toBe(201);
  expect(await res.json()).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
});

test("GET /api/albums/:albumID - should return a review for a given album", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const res = await api.get("/api/albums/0JGOiO34nwfUdDrD612dOp", authCookie);
  expect(res.status).toBe(200);

  const returned: {
    album: ReviewedAlbum;
    artists: ReviewedArtist[];
    tracks: ReviewedTrack[];
  } = await res.json();

  expect(returned.album).toHaveProperty("spotifyID");
  expect(returned.album).toHaveProperty("name");
  expect(returned.artists[0]).toHaveProperty("averageScore");
  expect(returned.tracks[0]).toHaveProperty("rating");
});

test("GET /api/albums - should return all album reviews", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);
  await api.post("/api/albums/create", { ...mockReviewData, album: { ...mockReviewData.album, id: "7fRrTyKvE4Skh93v97gtcU" } }, authCookie);

  const res = await api.get("/api/albums", authCookie);
  expect(res.status).toBe(200);

  const { albums }: { albums: DisplayAlbum[] } = await res.json();
  expect(albums[0]).toHaveProperty("spotifyID");
  expect(Array.isArray(albums[0].imageURLs)).toBe(true);
});

test("PUT /api/albums/:albumID/edit - should update album review", async () => {
  await api.post("/api/albums/create", mockReviewData, authCookie);

  const created = await (await api.get("/api/albums/0JGOiO34nwfUdDrD612dOp", authCookie)).json();
  mockUpdateData.album = created.album;

  const updateRes = await api.put("/api/albums/0JGOiO34nwfUdDrD612dOp/edit", mockUpdateData, authCookie);
  expect(updateRes.status).toBe(200);

  const updated = await (await api.get("/api/albums/0JGOiO34nwfUdDrD612dOp", authCookie)).json();
  expect(updated.album.reviewScore).toBe(90);
  expect(updated.album.reviewContent).toBe(mockUpdateData.reviewContent);
}, 15000);

test("POST /api/albums/create - should persist per-artist score flags", async () => {
  const collabData = JSON.parse(JSON.stringify(mockReviewData));
  collabData.album = {
    ...mockReviewData.album,
    id: "collab_album_1",
    artists: [
      mockReviewData.album.artists[0],
      {
        external_urls: { spotify: "https://open.spotify.com/artist/collab_artist_2" },
        href: "https://api.spotify.com/v1/artists/collab_artist_2",
        id: "collab_artist_2",
        name: "Collab Artist 2",
        type: "artist",
        uri: "spotify:artist:collab_artist_2",
      },
    ],
  };
  collabData.selectedArtistIDs = [mockReviewData.album.artists[0].id, "collab_artist_2"];
  collabData.scoreArtistIDs = [];

  const res = await api.post("/api/albums/create", collabData, authCookie);
  expect(res.status).toBe(201);

  const links = await query("SELECT artist_spotify_id, affects_score FROM album_artists WHERE album_spotify_id = $1 ORDER BY artist_spotify_id", ["collab_album_1"]);
  expect(links.rowCount).toBe(2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(links.rows.every((row: any) => row.affects_score === false)).toBe(true);
});

test("GET /api/albums/:albumID - returns 404 for an unknown album", async () => {
  const res = await api.get("/api/albums/thisIdDoesNotExist", authCookie);
  expect(res.status).toBe(404);
});

test("POST /api/albums/create - a mid-flight failure rolls the whole review back", async () => {
  // Force a failure at the end of the create transaction. refreshArtists calls
  // updateArtist last, so by then the album, tracks, genres and artist links have
  // all been created. The whole write must roll back together.
  const spy = vi.spyOn(ArtistModel, "updateArtist").mockRejectedValueOnce(new Error("forced mid-transaction failure"));

  const res = await api.post("/api/albums/create", mockReviewData, authCookie);
  expect(res.status).toBe(500);

  // None of the review's rows should have persisted.
  const albums = await query("SELECT 1 FROM reviewed_albums WHERE spotify_id = $1", [mockReviewData.album.id]);
  expect(albums.rowCount).toBe(0);

  const tracks = await query("SELECT 1 FROM reviewed_tracks WHERE album_spotify_id = $1", [mockReviewData.album.id]);
  expect(tracks.rowCount).toBe(0);

  const artistLinks = await query("SELECT 1 FROM album_artists WHERE album_spotify_id = $1", [mockReviewData.album.id]);
  expect(artistLinks.rowCount).toBe(0);

  const genreLinks = await query("SELECT 1 FROM album_genres WHERE album_spotify_id = $1", [mockReviewData.album.id]);
  expect(genreLinks.rowCount).toBe(0);

  // Note: the artist row itself is created before the transaction (the header scrape
  // stays outside it), so it is intentionally not rolled back.

  spy.mockRestore();
});
