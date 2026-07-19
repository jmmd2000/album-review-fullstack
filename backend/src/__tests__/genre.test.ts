import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "@/db/client";
import { mockReviewData, mockUpdateData } from "./constants";
import { resetTables } from "./testUtils";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";
import type { Genre } from "@shared/types";

let authCookie: string[];
const albumID = mockReviewData.album.id;

beforeAll(async () => {
  const res = await request(app).post("/api/auth/login").send({ password: process.env.ADMIN_PASSWORD! });
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

test("album creation stores genres", async () => {
  const create = await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);
  expect(create.status).toBe(201);

  const res = await request(app).get(`/api/albums/${albumID}`).set("Cookie", authCookie);
  expect(res.status).toBe(200);

  const albumGenres = (res.body.albumGenres as Genre[]).map(g => g.name).sort();
  const allGenres = (res.body.allGenres as Genre[]).map(g => g.name).sort();
  const expected = [...mockReviewData.genres].sort();
  expect(albumGenres).toEqual(expected);
  expect(allGenres).toEqual(expected);
});

test("filter albums by genre", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const res = await request(app)
    .get(`/api/albums?genres=${encodeURIComponent("pop")}`)
    .set("Cookie", authCookie);
  expect(res.status).toBe(200);
  expect(res.body.albums.length).toBe(1);
  expect(res.body.albums[0]).toHaveProperty("spotifyID", albumID);
  expect(res.body.totalCount).toBe(1);
});

test("updating genres replaces old entries", async () => {
  const create = await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);
  expect(create.status).toBe(201);

  const current = await request(app).get(`/api/albums/${albumID}`).set("Cookie", authCookie);
  const updateData = { ...mockUpdateData, album: current.body.album };

  const update = await request(app).put(`/api/albums/${albumID}/edit`).set("Cookie", authCookie).send(updateData);
  expect(update.status).toBe(200);

  const res = await request(app).get(`/api/albums/${albumID}`).set("Cookie", authCookie);
  const names = (res.body.albumGenres as Genre[]).map(g => g.name).sort();
  expect(names).toEqual(["genre1", "genre2", "genre3"]);
  const allNames = (res.body.allGenres as Genre[]).map(g => g.name).sort();
  expect(allNames).toEqual(["genre1", "genre2", "genre3"]);
});

test("deleting album clears unused genres", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  const del = await request(app).delete(`/api/albums/${albumID}`).set("Cookie", authCookie);
  expect(del.status).toBe(204);

  const res = await request(app).get("/api/albums").set("Cookie", authCookie);
  expect(res.status).toBe(200);
  expect(res.body.genres.length).toBe(0);
});

test("genre filter is kept when a search term is also present", async () => {
  await request(app).post("/api/albums/create").set("Cookie", authCookie).send(mockReviewData);

  await request(app)
    .post("/api/albums/create")
    .set("Cookie", authCookie)
    .send({
      ...mockReviewData,
      album: { ...mockReviewData.album, id: "7fRrTyKvE4Skh93v97gtcU", name: "Midnight Rockers" },
      genres: ["rock"],
    });

  const res = await request(app)
    .get(`/api/albums?genres=${encodeURIComponent("pop")}&search=${encodeURIComponent("Midnight")}`)
    .set("Cookie", authCookie);

  expect(res.status).toBe(200);
  expect(res.body.albums).toHaveLength(0);
  expect(res.body.totalCount).toBe(0);

  const popOnly = await request(app)
    .get(`/api/albums?genres=${encodeURIComponent("pop")}`)
    .set("Cookie", authCookie);
  expect(popOnly.body.albums).toHaveLength(1);
  expect(popOnly.body.albums[0]).toHaveProperty("spotifyID", mockReviewData.album.id);
  expect(popOnly.body.totalCount).toBe(1);
});
