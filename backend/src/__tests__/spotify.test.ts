import request from "supertest";
import { app } from "../index";
import { test, expect } from "@jest/globals";
import { DisplayAlbum, SpotifyAlbum, SpotifySearchResponse } from "@shared/types";

const agent = request.agent(app);

test("GET /api/spotify/token - Should return token and expiry time", async () => {
  const response = await agent.get("/api/spotify/token");

  const data = await response.body;

  expect(response.status).toBe(200);
  expect(data).toHaveProperty("token");
  expect(typeof data.token).toBe("string");
});

test("GET /api/spotify/albums/search?query=abba - Should return albums", async () => {
  const response = await agent.get("/api/spotify/albums/search?query=abba");

  const data: DisplayAlbum[] = await response.body;

  expect(response.status).toBe(200);
  expect(data[0]).toHaveProperty("name");
  expect(data[0]).toHaveProperty("spotifyID");
  expect(data[0]).toHaveProperty("imageURLs");
  expect(data[0]).toHaveProperty("artistName");
  expect(data[0]).toHaveProperty("artistSpotifyID");
  expect(data[0]).toHaveProperty("releaseYear");

  expect(data[0].imageURLs).toBeInstanceOf(Array);
  expect(data[0].imageURLs[0]).toHaveProperty("url");
  expect(data[0].imageURLs[0]).toHaveProperty("height");
  expect(data[0].imageURLs[0]).toHaveProperty("width");

  expect(typeof data[0].imageURLs[0].url).toBe("string");
  expect(typeof data[0].imageURLs[0].height).toBe("number");
  expect(typeof data[0].imageURLs[0].width).toBe("number");

  expect(typeof data[0].name).toBe("string");
  expect(typeof data[0].spotifyID).toBe("string");
  expect(typeof data[0].artistName).toBe("string");
  expect(typeof data[0].artistSpotifyID).toBe("string");
});

test("GET /api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=false - Should return album", async () => {
  const response = await agent.get("/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n?includeGenres=false");

  const data: SpotifyAlbum = await response.body;

  expect(data).toHaveProperty("album_type");
  expect(data).toHaveProperty("artists");
  expect(data).toHaveProperty("available_markets");
  expect(data).toHaveProperty("external_urls");
  expect(data).toHaveProperty("href");
  expect(data).toHaveProperty("id");
  expect(data).toHaveProperty("images");
  expect(data).toHaveProperty("name");
  expect(data).toHaveProperty("release_date");
  expect(data).toHaveProperty("release_date_precision");
  expect(data).toHaveProperty("total_tracks");
  expect(data).toHaveProperty("type");
  expect(data).toHaveProperty("uri");
  expect(data).toHaveProperty("tracks");
  expect(data.tracks).toHaveProperty("items");

  expect(Array.isArray(data.artists)).toBe(true);
  expect(Array.isArray(data.available_markets)).toBe(true);
  expect(Array.isArray(data.images)).toBe(true);
  expect(Array.isArray(data.tracks.items)).toBe(true);

  expect(typeof data.album_type).toBe("string");
  expect(typeof data.href).toBe("string");
  expect(typeof data.id).toBe("string");
  expect(typeof data.name).toBe("string");
  expect(typeof data.release_date).toBe("string");
  expect(typeof data.release_date_precision).toBe("string");
  expect(typeof data.total_tracks).toBe("number");
  expect(typeof data.type).toBe("string");
  expect(typeof data.uri).toBe("string");
  expect(typeof data.external_urls).toBe("object");
});
