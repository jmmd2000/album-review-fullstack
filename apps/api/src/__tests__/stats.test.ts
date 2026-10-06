import { afterAll, beforeEach, afterEach, test, expect } from "vitest";
import { query, closeDatabase } from "@/db/client";
import { resetTables } from "./testUtils";
import { StatsService } from "@/api/services/StatsService";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { GenreModel } from "@/api/models/Genre";
import { TrackModel } from "@/api/models/Track";

async function createArtist(id: string, score: number, unrated = false) {
  return ArtistModel.createArtist({
    spotifyID: id,
    name: id,
    imageURLs: [],
    headerImage: null,
    averageScore: score,
    bonusPoints: 0,
    bonusReason: JSON.stringify([]),
    totalScore: score,
    reviewCount: 1,
    unrated,
    leaderboardPosition: null,
  });
}

async function createAlbum(id: string, score: number | null, artistID: string) {
  return AlbumModel.createAlbum({
    spotifyID: id,
    name: id,
    artistSpotifyID: artistID,
    artistName: artistID,
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    imageURLs: [],
    bestSong: "1",
    worstSong: "1",
    runtime: "00:00",
    reviewContent: "",
    reviewScore: score ?? 0,
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
    genres: [],
  });
}

async function createTrack(id: string, albumID: string, artistID: string, rating: number) {
  return TrackModel.createTrack({ spotifyID: id, albumSpotifyID: albumID, artistSpotifyID: artistID, artistName: artistID, name: id, duration: 200, features: [], rating });
}

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("the overview sends only scored albums, lowest score first", async () => {
  await createArtist("artist1", 70);
  await createAlbum("high", 90, "artist1");
  await createAlbum("unscored", null, "artist1");
  await createAlbum("low", 40, "artist1");

  const overview = await StatsService.getOverview();
  expect(overview.albums.map(album => album.spotifyID)).toEqual(["low", "high"]);
});

test("each album carries its genre slugs and all its artists", async () => {
  await createArtist("artist1", 70);
  await createArtist("artist2", 60);
  await createAlbum("album1", 80, "artist1");
  const pop = await GenreModel.createGenre({ name: "Pop", slug: "pop" });
  const rock = await GenreModel.createGenre({ name: "Rock", slug: "rock" });
  await GenreModel.linkGenresToAlbum("album1", [pop.id, rock.id]);
  await AlbumModel.upsertAlbumArtists("album1", [
    { artistSpotifyID: "artist1", affectsScore: true },
    { artistSpotifyID: "artist2", affectsScore: false },
  ]);

  const [album] = (await StatsService.getOverview()).albums;
  expect(album!.genres.sort()).toEqual(["pop", "rock"]);
  expect(album!.artistSpotifyIDs.sort()).toEqual(["artist1", "artist2"]);
});

test("the overview sends only rated artists, but counts every artist", async () => {
  await createArtist("rated", 70);
  await createArtist("unrated", 0, true);

  const overview = await StatsService.getOverview();
  expect(overview.artists.map(artist => artist.spotifyID)).toEqual(["rated"]);
  expect(overview.artistCount).toBe(2);
});

test("the track total leaves out unrated tracks", async () => {
  await createArtist("artist1", 70);
  await createAlbum("album1", 80, "artist1");
  await createTrack("rated", "album1", "artist1", 7);
  await createTrack("unrated", "album1", "artist1", 0);

  expect((await StatsService.getOverview()).ratedTrackCount).toBe(1);
});
