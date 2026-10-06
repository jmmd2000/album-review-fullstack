import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { GenreModel } from "@/api/models/Genre";
import { TrackModel } from "@/api/models/Track";

// stats.test.ts covers the stats logic. This file checks the route with one review.
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

test("GET /api/stats returns the overview", async () => {
  const res = await api.get("/api/stats");
  expect(res.status).toBe(200);

  const overview = await res.json();
  expect(overview.albums.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["album1"]);
  expect(overview.albums[0].genres).toEqual(["genre1"]);
  expect(overview.genres).toEqual([{ name: "Genre One", slug: "genre1", albumCount: 1 }]);
});
