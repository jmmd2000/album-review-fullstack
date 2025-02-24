import request from "supertest";
import { app } from "../index";
import { query } from "../../db";
import { test, expect, beforeEach, afterAll } from "@jest/globals";
import { mockReviewData } from "./constants";
import { ReviewedAlbum, ReviewedArtist } from "@shared/types";

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
  console.log(response.body);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
});

test("GET /api/albums/:albumID - should return a review for a given album", async () => {
  // First, create a review
  const album = await request(app).post("/api/albums/create").send(mockReviewData);
  console.log(album.body.spotifyID);

  const response = await request(app).get("/api/albums/0JGOiO34nwfUdDrD612dOp");
  const returnedData: {
    reviewed_albums: ReviewedAlbum;
    reviewed_artists: ReviewedArtist;
  } = response.body;
  console.log(returnedData);
  expect(response.status).toBe(200);
  expect(returnedData.reviewed_albums).toHaveProperty("spotifyID", "0JGOiO34nwfUdDrD612dOp");
  expect(returnedData.reviewed_albums).toHaveProperty("reviewContent", "Amazing album with deep emotions.");
});
