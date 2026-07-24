import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { GenreModel } from "@/api/models/Genre";
import { TrackModel } from "@/api/models/Track";

// The stats logic itself is covered in stats.test.ts, these tests cover the
// route wiring and validation with one album's worth of data.
async function seedOneReview() {
  const genre = await GenreModel.createGenre({ name: "Genre One", slug: "genre1" });

  await ArtistModel.createArtist({
    spotifyID: "artist1",
    name: "Artist 1",
    imageURLs: [],
    headerImage: null,
    averageScore: 95,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: 95,
    reviewCount: 1,
    unrated: false,
    leaderboardPosition: null,
  });

  const album = await AlbumModel.createAlbum({
    spotifyID: "album1",
    name: "Album 1",
    artistSpotifyID: "artist1",
    artistName: "Artist 1",
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    bestSong: "1",
    worstSong: "1",
    runtime: "00:00",
    reviewContent: "",
    reviewScore: 95,
    reviewBonuses: {
      perfectBonus: 0,
      qualityBonus: 0,
      consistencyBonus: 0,
      noWeakBonus: 0,
      terriblePenalty: 0,
      poorQualityPenalty: 0,
      noStrongPenalty: 0,
      totalBonus: 0,
    },
    finalScore: 95,
    affectsArtistScore: true,
    colors: [],
    genres: [genre.slug],
  });

  await GenreModel.linkGenresToAlbum(album.spotifyID, [genre.id]);

  await TrackModel.createTrack({
    spotifyID: "t1",
    albumSpotifyID: album.spotifyID,
    artistSpotifyID: "artist1",
    artistName: "Artist 1",
    name: "track",
    duration: 200,
    features: [],
    rating: 10,
  });
}

beforeEach(async () => {
  await resetTables(query);
  await seedOneReview();
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("GET /api/stats/favourites returns the seeded review", async () => {
  const res = await api.get("/api/stats/favourites");
  expect(res.status).toBe(200);

  const stats = await res.json();
  expect(stats.favouriteAlbum?.spotifyID).toBe("album1");
  expect(stats.favouriteArtist?.spotifyID).toBe("artist1");
});

test("GET /api/stats/genres returns details for a slug", async () => {
  const res = await api.get("/api/stats/genres?slug=genre1");
  expect(res.status).toBe(200);

  const stats = await res.json();
  expect(stats.slug).toBe("genre1");
  expect(stats.reviewedAlbumCount).toBe(1);
});

test("GET /api/stats/distribution returns tiers for a valid resource", async () => {
  const res = await api.get("/api/stats/distribution?resource=albums");
  expect(res.status).toBe(200);

  const distribution = await res.json();
  const total = distribution.reduce((sum: number, tier: { count: number }) => sum + tier.count, 0);
  expect(total).toBe(1);
});

test("GET /api/stats/distribution rejects an unknown resource", async () => {
  const res = await api.get("/api/stats/distribution?resource=bogus");
  expect(res.status).toBe(400);
});

test("GET /api/stats/counts summarises the totals", async () => {
  const res = await api.get("/api/stats/counts");
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ albumCount: 1, artistCount: 1, genreCount: 1, trackCount: 1 });
});
