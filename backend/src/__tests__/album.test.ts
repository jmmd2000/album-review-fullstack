import request from "supertest";
import { app } from "../index";
import { query } from "../../db";
import { test, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals";
import { mockReviewData, mockUpdateData } from "./constants";
import type { DisplayAlbum, ReviewedAlbum, ReviewedArtist, ReviewedTrack } from "@shared/types";

const agent = request.agent(app);

beforeAll(async () => {
  // Log in
  const res = await agent.post("/api/auth/login").send({ password: process.env.ADMIN_PASSWORD ?? "123" });
  expect(res.status).toBe(204);
});

beforeEach(async () => {
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

afterEach(async () => {
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

afterAll(async () => {
  // Optionally log out
  await agent.post("/api/auth/logout");
});

test("POST /api/albums/create - should create a new album review", async () => {
  const response = await agent.post("/api/albums/create").send(mockReviewData);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
});

test("GET /api/albums/:albumID - should return a review for a given album", async () => {
  // Create via the agent so it’s authenticated
  await agent.post("/api/albums/create").send(mockReviewData);

  const response = await agent.get("/api/albums/0JGOiO34nwfUdDrD612dOp");
  const returnedData: {
    album: ReviewedAlbum;
    artist: ReviewedArtist;
    tracks: ReviewedTrack[];
  } = response.body;

  expect(response.status).toBe(200);
  expect(returnedData.album).toHaveProperty("spotifyID");
  expect(returnedData.album).toHaveProperty("name");
  expect(returnedData.album).toHaveProperty("artistSpotifyID");
  expect(returnedData.album).toHaveProperty("artistName");
  expect(returnedData.album).toHaveProperty("releaseYear");
  expect(returnedData.album).toHaveProperty("releaseDate");
  expect(returnedData.album).toHaveProperty("reviewScore");
  expect(returnedData.album).toHaveProperty("reviewContent");
  expect(returnedData.album).toHaveProperty("colors");
  expect(returnedData.album).toHaveProperty("imageURLs");
  expect(returnedData.album).toHaveProperty("bestSong");
  expect(returnedData.album).toHaveProperty("worstSong");
  expect(returnedData.album).toHaveProperty("runtime");

  expect(returnedData.artist).toHaveProperty("name");
  expect(returnedData.artist).toHaveProperty("spotifyID");
  expect(returnedData.artist).toHaveProperty("imageURLs");
  expect(returnedData.artist).toHaveProperty("leaderboardPosition");
  expect(returnedData.artist).toHaveProperty("averageScore");
  expect(returnedData.artist).toHaveProperty("bonusPoints");
  expect(returnedData.artist).toHaveProperty("totalScore");

  expect(returnedData.tracks[0]).toHaveProperty("name");
  expect(returnedData.tracks[0]).toHaveProperty("spotifyID");
  expect(returnedData.tracks[0]).toHaveProperty("features");
  expect(returnedData.tracks[0]).toHaveProperty("duration");
  expect(returnedData.tracks[0]).toHaveProperty("rating");

  expect(typeof returnedData.album.spotifyID).toBe("string");
  expect(typeof returnedData.album.name).toBe("string");
  expect(typeof returnedData.album.artistSpotifyID).toBe("string");
  expect(typeof returnedData.album.artistName).toBe("string");
  expect(typeof returnedData.album.releaseYear).toBe("number");
  expect(typeof returnedData.album.releaseDate).toBe("string");
  expect(typeof returnedData.album.reviewScore).toBe("number");
  expect(typeof returnedData.album.reviewContent).toBe("string");
  expect(typeof returnedData.album.colors).toBe("object");
  expect(Array.isArray(returnedData.album.imageURLs)).toBe(true);
  expect(typeof returnedData.album.bestSong).toBe("string");
  expect(typeof returnedData.album.worstSong).toBe("string");
  expect(typeof returnedData.album.runtime).toBe("string");

  expect(typeof returnedData.artist.name).toBe("string");
  expect(typeof returnedData.artist.spotifyID).toBe("string");
  expect(Array.isArray(returnedData.artist.imageURLs)).toBe(true);
  expect(typeof returnedData.artist.leaderboardPosition).toBe("number");
  expect(typeof returnedData.artist.averageScore).toBe("number");
  expect(typeof returnedData.artist.bonusPoints).toBe("number");
  expect(typeof returnedData.artist.totalScore).toBe("number");

  expect(typeof returnedData.tracks[0].name).toBe("string");
  expect(typeof returnedData.tracks[0].spotifyID).toBe("string");
  expect(typeof returnedData.tracks[0].features === "object" || Array.isArray(returnedData.tracks[0].features)).toBe(true);
  expect(typeof returnedData.tracks[0].duration).toBe("number");
  expect(typeof returnedData.tracks[0].rating).toBe("number");
}, 15000);

test("GET /api/albums - should return all album reviews", async () => {
  // Create two reviews
  await agent.post("/api/albums/create").send(mockReviewData);
  await agent.post("/api/albums/create").send({
    ...mockReviewData,
    album: { spotifyID: "7fRrTyKvE4Skh93v97gtcU" },
  });

  const response = await agent.get("/api/albums");
  const returnedData: { albums: DisplayAlbum[]; furtherPages: boolean; totalCount: number } = response.body;

  expect(response.status).toBe(200);
  expect(returnedData.albums[0]).toHaveProperty("name");
  expect(returnedData.albums[0]).toHaveProperty("spotifyID");
  expect(returnedData.albums[0]).toHaveProperty("imageURLs");
  expect(returnedData.albums[0]).toHaveProperty("artistName");
  expect(returnedData.albums[0]).toHaveProperty("artistSpotifyID");
  expect(returnedData.albums[0]).toHaveProperty("releaseYear");

  expect(returnedData.albums[0].imageURLs).toBeInstanceOf(Array);
  expect(returnedData.albums[0].imageURLs[0]).toHaveProperty("url");
  expect(returnedData.albums[0].imageURLs[0]).toHaveProperty("height");
  expect(returnedData.albums[0].imageURLs[0]).toHaveProperty("width");

  expect(typeof returnedData.albums[0].imageURLs[0].url).toBe("string");
  expect(typeof returnedData.albums[0].imageURLs[0].height).toBe("number");
  expect(typeof returnedData.albums[0].imageURLs[0].width).toBe("number");

  expect(typeof returnedData.albums[0].name).toBe("string");
  expect(typeof returnedData.albums[0].spotifyID).toBe("string");
  expect(typeof returnedData.albums[0].artistName).toBe("string");
  expect(typeof returnedData.albums[0].artistSpotifyID).toBe("string");
  expect(typeof returnedData.albums[0].releaseYear).toBe("number");
}, 15000);

test("PUT /api/albums/:albumID/edit - should update album review", async () => {
  await agent.post("/api/albums/create").send(mockReviewData);
  const createdAlbumResponse = await agent.get("/api/albums/0JGOiO34nwfUdDrD612dOp");
  const createdAlbumData = createdAlbumResponse.body.album;
  mockUpdateData.album = createdAlbumData;

  const updateResponse = await agent.put("/api/albums/0JGOiO34nwfUdDrD612dOp/edit").send(mockUpdateData);

  expect(updateResponse.status).toBe(200);

  const updatedAlbumResponse = await agent.get("/api/albums/0JGOiO34nwfUdDrD612dOp");
  const updatedAlbumData = updatedAlbumResponse.body.album;

  expect(updatedAlbumData.reviewScore).toBe(90);
  expect(updatedAlbumData.reviewContent).toBe(mockUpdateData.reviewContent);
  expect(updatedAlbumData.bestSong).toBe(mockUpdateData.bestSong);
  expect(updatedAlbumData.worstSong).toBe(mockUpdateData.worstSong);
  expect(updatedAlbumData.genres).toStrictEqual(mockUpdateData.genres);
  expect(updatedAlbumData.colors).toStrictEqual(mockUpdateData.colors);
}, 15000);
