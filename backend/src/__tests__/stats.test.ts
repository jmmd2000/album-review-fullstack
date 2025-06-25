import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  test,
  expect,
} from "@jest/globals";
import { query, closeDatabase } from "../../db";
import { resetTables } from "./testUtils";
import { StatsService } from "@/api/services/statsService";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { GenreModel } from "@/api/models/Genre";
import { TrackModel } from "@/api/models/Track";

async function createArtist(id: string, name: string, score: number) {
  return ArtistModel.createArtist({
    spotifyID: id,
    name,
    imageURLs: [],
    headerImage: null,
    averageScore: score,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: score,
    reviewCount: 1,
    unrated: false,
    leaderboardPosition: null,
  });
}

async function createAlbum(
  id: string,
  name: string,
  score: number,
  artistId: string,
  artistName: string,
  genreNames: string[]
) {
  return AlbumModel.createAlbum({
    spotifyID: id,
    name,
    artistSpotifyID: artistId,
    artistName,
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    bestSong: "1",
    worstSong: "1",
    runtime: "00:00",
    reviewContent: "",
    reviewScore: score,
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
    finalScore: score,
    affectsArtistScore: true,
    colors: [],
    genres: genreNames,
  });
}

async function createTrack(
  id: string,
  albumId: string,
  artistId: string,
  artistName: string
) {
  return TrackModel.createTrack({
    spotifyID: id,
    albumSpotifyID: albumId,
    artistSpotifyID: artistId,
    artistName,
    name: "track",
    duration: 200,
    features: [],
    rating: 10,
  });
}

async function setupData() {
  const g1 = await GenreModel.createGenre({
    name: "Genre One",
    slug: "genre1",
  });
  const g2 = await GenreModel.createGenre({
    name: "Genre Two",
    slug: "genre2",
  });
  const g3 = await GenreModel.createGenre({
    name: "Genre Three",
    slug: "genre3",
  });

  const a1 = await createArtist("artist1", "Artist 1", 95);
  const a2 = await createArtist("artist2", "Artist 2", 45);
  const a3 = await createArtist("artist3", "Artist 3", 60);

  const alb1 = await createAlbum(
    "album1",
    "Album 1",
    95,
    a1.spotifyID,
    a1.name,
    [g1.slug, g2.slug]
  );
  const alb2 = await createAlbum(
    "album2",
    "Album 2",
    45,
    a2.spotifyID,
    a2.name,
    [g2.slug, g3.slug]
  );
  const alb3 = await createAlbum(
    "album3",
    "Album 3",
    60,
    a3.spotifyID,
    a3.name,
    [g1.slug, g3.slug]
  );

  await GenreModel.linkGenresToAlbum(alb1.spotifyID, [g1.id, g2.id]);
  await GenreModel.linkGenresToAlbum(alb2.spotifyID, [g2.id, g3.id]);
  await GenreModel.linkGenresToAlbum(alb3.spotifyID, [g1.id, g3.id]);

  await createTrack("t1", alb1.spotifyID, a1.spotifyID, a1.name);
  await createTrack("t2", alb2.spotifyID, a2.spotifyID, a2.name);
  await createTrack("t3", alb3.spotifyID, a3.spotifyID, a3.name);
}

beforeEach(async () => {
  await resetTables(query);
  await setupData();
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("favourites reflect highest and lowest scores", async () => {
  const stats = await StatsService.getFavourites();
  expect(stats.favouriteAlbum?.spotifyID).toBe("album1");
  expect(stats.leastFavouriteAlbum?.spotifyID).toBe("album2");
  expect(stats.favouriteArtist?.spotifyID).toBe("artist1");
  expect(stats.leastFavouriteArtist?.spotifyID).toBe("artist2");
  expect(stats.favouriteGenre?.slug).toBe("genre1");
  expect(stats.leastFavouriteGenre?.slug).toBe("genre3");
});

test("genre stats for a slug returns correct details", async () => {
  const stats = await StatsService.getGenreStats("genre1");
  expect(stats.reviewedAlbumCount).toBe(2);
  expect(stats.averageScore).toBeCloseTo(77.5, 1);
  expect(stats.albums?.highestRated.spotifyID).toBe("album1");
  expect(stats.albums?.lowestRated.spotifyID).toBe("album3");
  expect(stats.slug).toBe("genre1");
  expect(stats.name).toBe("Genre One");
  expect(stats.allGenres.length).toBe(3);
});

test("genre stats without slug returns nulls", async () => {
  const stats = await StatsService.getGenreStats(undefined);
  expect(stats.reviewedAlbumCount).toBeNull();
  expect(stats.averageScore).toBeNull();
  expect(stats.relatedGenres).toBeNull();
  expect(stats.albums).toBeNull();
  expect(stats.name).toBeNull();
  expect(stats.slug).toBeNull();
  expect(stats.allGenres.length).toBe(3);
});

test("rating distribution groups albums by tier", async () => {
  const dist = await StatsService.getRatingDistribution("albums");
  const perfect = dist.find(d => d.rating === "Perfect");
  const meh = dist.find(d => d.rating === "Meh");
  const good = dist.find(d => d.rating === "Good");
  expect(perfect?.count).toBe(1);
  expect(meh?.count).toBe(1);
  expect(good?.count).toBe(1);
  const total = dist.reduce((sum, d) => sum + d.count, 0);
  expect(total).toBe(3);
});

test("resource counts summarise totals", async () => {
  const counts = await StatsService.getResourceCounts();
  expect(counts.albumCount).toBe(3);
  expect(counts.artistCount).toBe(3);
  expect(counts.genreCount).toBe(3);
  expect(counts.trackCount).toBe(3);
});
