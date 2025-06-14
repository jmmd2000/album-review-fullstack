import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { resetTables } from "./testUtils";
import { beforeAll, beforeEach, afterEach, afterAll, test, expect } from "@jest/globals";

const mockAlbum = {
  spotifyID: "1",
  name: "Album",
  artistName: "Artist",
  artistSpotifyID: "a1",
  releaseYear: 2020,
  imageURLs: [],
  finalScore: null,
  affectsArtistScore: false,
};

let authCookie: string[];

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD ?? "123" });
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

test("bookmark album and fetch", async () => {
  const add = await request(app).post("/api/bookmarks/1/add").set("Cookie", authCookie).send(mockAlbum);
  expect(add.status).toBe(200);

  const fetched = await request(app).get("/api/bookmarks/1").set("Cookie", authCookie);
  expect(fetched.status).toBe(200);
  expect(fetched.body).toHaveProperty("spotifyID", "1");
});

test("bookmark statuses", async () => {
  await request(app).post("/api/bookmarks/1/add").set("Cookie", authCookie).send(mockAlbum);

  const statusRes = await request(app).get("/api/bookmarks/status?ids=1,2").set("Cookie", authCookie);
  expect(statusRes.status).toBe(200);
  expect(statusRes.body).toEqual({ "1": true, "2": false });
});

test("remove bookmarked album", async () => {
  await request(app).post("/api/bookmarks/1/add").set("Cookie", authCookie).send(mockAlbum);

  const del = await request(app).delete("/api/bookmarks/1/remove").set("Cookie", authCookie);
  expect(del.status).toBe(204);
});
