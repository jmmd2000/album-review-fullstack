import { test, expect } from "@jest/globals";
import { SpotifySearchResponse } from "../../types";

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
  const response = await fetch("http://localhost:4000/api/spotify/search?q=abba");

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
