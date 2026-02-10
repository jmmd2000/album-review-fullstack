import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { resetTables } from "./testUtils";
import { mockReviewData, mockUpdateData } from "./constants";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";

let authCookie: string[];
const artistID = mockReviewData.album.artists[0].id;
const albumID = mockReviewData.album.id;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD! });
  expect(res.status).toBe(204);
  const setCookie = res.get("set-cookie");
  authCookie = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
});

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await request(app).post("/api/auth/logout").set("Cookie", authCookie).send();
  await closeDatabase();
});

test("artist flagged unrated until an album affects score", async () => {
  const createRes = await request(app)
    .post("/api/albums/create")
    .set("Cookie", authCookie)
    .send({ ...mockReviewData, affectsArtistScore: false });
  expect(createRes.status).toBe(201);

  let artistRes = await request(app).get(`/api/artists/${artistID}`);
  expect(artistRes.status).toBe(200);
  expect(artistRes.body.unrated).toBe(true);

  const updateData = { ...mockUpdateData, album: createRes.body, affectsArtistScore: true };
  const updateRes = await request(app).put(`/api/albums/${albumID}/edit`).set("Cookie", authCookie).send(updateData);
  expect(updateRes.status).toBe(200);

  artistRes = await request(app).get(`/api/artists/${artistID}`);
  expect(artistRes.body.unrated).toBe(false);
});
