import request from "supertest";
import { app } from "../index";
import { query } from "../../db";
import { test, expect, beforeEach, afterAll } from "@jest/globals";
import { mockReviewData } from "./constants";
import { DisplayAlbum, ReviewedAlbum, ReviewedArtist, ReviewedTrack } from "@shared/types";
import { seed } from "../db/seed";

beforeEach(async () => {
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

afterAll(async () => {
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

test("POST /api/albums/create - should create a new album review", async () => {
  const response = await request(app).post("/api/albums/create").send(mockReviewData);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
});

test("GET /api/albums/:albumID - should return a review for a given album", async () => {
  // Create a review
  const album = await request(app).post("/api/albums/create").send(mockReviewData);
  console.log(album.body.spotifyID);

  const response = await request(app).get("/api/albums/0JGOiO34nwfUdDrD612dOp");
  const returnedData: {
    album: ReviewedAlbum;
    artist: ReviewedArtist;
    tracks: ReviewedTrack[];
  } = response.body;

  console.log(returnedData);

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
});

test("GET /api/albums - should return all album reviews", async () => {
  await seed(["7fRrTyKvE4Skh93v97gtcU", "0S0KGZnfBGSIssfF54WSJh", "0JGOiO34nwfUdDrD612dOp"], {
    reviewContent: "Amazing album with deep emotions.",
    bestSong: "The Best Song",
    worstSong: "The Worst Song",
  });
  const response = await request(app).get("/api/albums");
  const returnedData: DisplayAlbum[] = response.body;
  console.log(returnedData);

  expect(response.status).toBe(200);
  // expect(returnedData.length).toBeGreaterThan(0);
  expect(returnedData[0]).toHaveProperty("name");
  expect(returnedData[0]).toHaveProperty("spotifyID");
  expect(returnedData[0]).toHaveProperty("imageURLs");
  expect(returnedData[0]).toHaveProperty("artistName");
  expect(returnedData[0]).toHaveProperty("artistSpotifyID");
  expect(returnedData[0]).toHaveProperty("releaseYear");

  expect(returnedData[0].imageURLs).toBeInstanceOf(Array);
  expect(returnedData[0].imageURLs[0]).toHaveProperty("url");
  expect(returnedData[0].imageURLs[0]).toHaveProperty("height");
  expect(returnedData[0].imageURLs[0]).toHaveProperty("width");

  expect(typeof returnedData[0].imageURLs[0].url).toBe("string");
  expect(typeof returnedData[0].imageURLs[0].height).toBe("number");
  expect(typeof returnedData[0].imageURLs[0].width).toBe("number");

  expect(typeof returnedData[0].name).toBe("string");
  expect(typeof returnedData[0].spotifyID).toBe("string");
  expect(typeof returnedData[0].artistName).toBe("string");
  expect(typeof returnedData[0].artistSpotifyID).toBe("string");
  expect(typeof returnedData[0].releaseYear).toBe("number");
});
