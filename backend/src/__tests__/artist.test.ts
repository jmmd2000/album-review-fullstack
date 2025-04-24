import request from "supertest";
import { app } from "../index";
import { query } from "../../db";
import { test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import type { ReviewedArtist } from "@shared/types";
import { seed } from "../db/seed";

const agent = request.agent(app);

beforeAll(async () => {
  // Log in
  const res = await agent.post("/api/auth/login").send({ password: process.env.ADMIN_PASSWORD });
  expect(res.status).toBe(204);
});

beforeEach(async () => {
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

afterAll(async () => {
  // Optionally log out
  await agent.post("/api/auth/logout");
  await query("DELETE FROM reviewed_tracks;");
  await query("DELETE FROM reviewed_albums;");
  await query("DELETE FROM reviewed_artists;");
});

test("GET /api/artists - should return all artist reviews", async () => {
  await seed(["7fRrTyKvE4Skh93v97gtcU", "0S0KGZnfBGSIssfF54WSJh", "0JGOiO34nwfUdDrD612dOp"], {
    reviewContent: "Amazing album with deep emotions.",
  });

  const response = await agent.get("/api/artists/all");
  const returnedData: ReviewedArtist[] = response.body;

  expect(response.status).toBe(200);
  expect(returnedData.length).toBeGreaterThan(0);
  expect(returnedData[0]).toHaveProperty("id");
  expect(returnedData[0]).toHaveProperty("spotifyID");
  expect(returnedData[0]).toHaveProperty("name");
  expect(returnedData[0]).toHaveProperty("imageURLs");
  expect(returnedData[0]).toHaveProperty("leaderboardPosition");
  expect(returnedData[0]).toHaveProperty("averageScore");
  expect(returnedData[0]).toHaveProperty("bonusPoints");
  expect(returnedData[0]).toHaveProperty("bonusReason");
  expect(returnedData[0]).toHaveProperty("totalScore");
  expect(returnedData[0]).toHaveProperty("imageUpdatedAt");

  expect(typeof returnedData[0].id).toBe("number");
  expect(typeof returnedData[0].spotifyID).toBe("string");
  expect(typeof returnedData[0].name).toBe("string");
  expect(typeof returnedData[0].imageURLs).toBe("object");
  expect(typeof returnedData[0].leaderboardPosition).toBe("number");
  expect(typeof returnedData[0].averageScore).toBe("number");
  expect(typeof returnedData[0].bonusPoints).toBe("number");
  expect(returnedData[0].bonusReason === null || typeof returnedData[0].bonusReason === "string").toBe(true);
  expect(typeof returnedData[0].totalScore).toBe("number");
  expect(new Date(returnedData[0].imageUpdatedAt)).toBeInstanceOf(Date);
}, 15000);
