import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { ArtistModel } from "@/api/models/Artist";

const authCookie = adminCookie();

async function seedArtist() {
  await ArtistModel.createArtist({
    spotifyID: "artist1",
    name: "Artist 1",
    imageURLs: [],
    headerImage: null,
    averageScore: 80,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: 80,
    reviewCount: 1,
    unrated: false,
    leaderboardPosition: null,
  });
}

beforeEach(async () => {
  await resetTables(query);
  await seedArtist();
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("updating a header image requires admin", async () => {
  const res = await api.put("/api/artists/artist1/headerImage", { headerImage: "https://example.com/h.jpg" });
  expect(res.status).toBe(401);
});

test("a header image update writes through", async () => {
  const res = await api.put("/api/artists/artist1/headerImage", { headerImage: "https://example.com/h.jpg" }, authCookie);
  expect(res.status).toBe(200);

  const artist = await ArtistModel.getArtistBySpotifyID("artist1");
  expect(artist.headerImage).toBe("https://example.com/h.jpg");
});

test("a header image can be cleared with null", async () => {
  await api.put("/api/artists/artist1/headerImage", { headerImage: "https://example.com/h.jpg" }, authCookie);

  const res = await api.put("/api/artists/artist1/headerImage", { headerImage: null }, authCookie);
  expect(res.status).toBe(200);

  const artist = await ArtistModel.getArtistBySpotifyID("artist1");
  expect(artist.headerImage).toBeNull();
});

test("a header image that isn't a web link is rejected", async () => {
  for (const headerImage of ["not a link", "javascript:alert(1)"]) {
    const res = await api.put("/api/artists/artist1/headerImage", { headerImage }, authCookie);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("The header image must be a web link.");
  }

  const artist = await ArtistModel.getArtistBySpotifyID("artist1");
  expect(artist.headerImage).toBeNull();
});

test("updating the header of an unknown artist returns 404", async () => {
  const res = await api.put("/api/artists/nope/headerImage", { headerImage: null }, authCookie);
  expect(res.status).toBe(404);
});

test("deleting an artist requires admin", async () => {
  const res = await api.delete("/api/artists/artist1");
  expect(res.status).toBe(401);
});

test("deleting an artist removes it", async () => {
  const res = await api.delete("/api/artists/artist1", authCookie);
  expect(res.status).toBe(204);

  expect(await ArtistModel.getArtistBySpotifyID("artist1")).toBeUndefined();
});

test("deleting an unknown artist returns 404", async () => {
  const res = await api.delete("/api/artists/nope", authCookie);
  expect(res.status).toBe(404);
});
