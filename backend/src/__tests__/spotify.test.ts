import { test, expect } from "@jest/globals";
import { SpotifyAlbum, SpotifySearchResponse } from "../../types";

test("GET /api/spotify/token - Should return token and expiry time", async () => {
  const response = await fetch("http://localhost:4000/api/spotify/token", {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data).toHaveProperty("token");
  expect(typeof data.token).toBe("string");
});

test("GET /api/spotify/search?q=abba - Should return albums", async () => {
  const response = await fetch("http://localhost:4000/api/spotify/albums?q=abba");

  const data: SpotifySearchResponse = await response.json();

  expect(response.status).toBe(200);
  expect(data).toHaveProperty("albums");
  expect(data.albums).toHaveProperty("href");
  expect(data.albums).toHaveProperty("items");
  expect(Array.isArray(data.albums.items)).toBe(true);
  expect(typeof data.albums.limit).toBe("number");

  //? The next and previous properties can be either a string or null (which is a type of object)
  expect(["string", "object"].includes(typeof data.albums.next)).toBe(true);
  expect(typeof data.albums.offset).toBe("number");

  //? The next and previous properties can be either a string or null (which is a type of object)
  expect(["string", "object"].includes(typeof data.albums.previous)).toBe(true);
  expect(typeof data.albums.total).toBe("number");
});

test("GET /api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n - Should return album", async () => {
  const response = await fetch("http://localhost:4000/api/spotify/albums/7aJuG4TFXa2hmE4z1yxc3n");

  const data: SpotifyAlbum = await response.json();

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
