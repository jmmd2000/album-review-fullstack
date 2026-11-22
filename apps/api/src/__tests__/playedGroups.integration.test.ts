import { afterAll, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { PlayModel } from "@/api/models/Play";
import { PlayedGroupModel } from "@/api/models/PlayedGroup";
import { TrackModel } from "@/api/models/Track";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

interface PlayOptions {
  albumID: string;
  albumName?: string;
  albumType?: string;
  isrc?: string;
  artistID?: string;
}

const play = (trackID: string, playedAt: string, { albumID, albumName = albumID, albumType = "album", isrc, artistID = "artist" }: PlayOptions): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: "Vampire in the Corner",
    duration_ms: 200000,
    artists: [{ id: artistID, name: artistID }],
    album: {
      id: albumID,
      name: albumName,
      album_type: albumType,
      release_date: "2024-08-23",
      images: [{ url: `${albumID}.jpg`, width: 640, height: 640 }],
      artists: [{ id: artistID, name: artistID }],
    },
    external_ids: isrc ? { isrc } : undefined,
  },
});

async function seedReviewedTrack(albumID: string, trackID: string, isrc: string, rating: number) {
  await ArtistModel.createArtist({ spotifyID: "artist", name: "artist", imageURLs: [], headerImage: null, totalScore: 0, reviewCount: 1, unrated: false, leaderboardPosition: null });
  await AlbumModel.createAlbum({
    spotifyID: albumID,
    name: "Imaginal Disk",
    artistSpotifyID: "artist",
    artistName: "artist",
    releaseDate: "2024-08-23",
    releaseYear: 2024,
    imageURLs: [{ url: "reviewed-640.jpg", width: 640, height: 640 }],
    runtime: "40 minutes",
    reviewContent: "",
    reviewScore: 80,
    bonus: 0,
    finalScore: 80,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
  await TrackModel.createTrack({
    artistSpotifyID: "artist",
    artistName: "artist",
    albumSpotifyID: albumID,
    name: "Vampire in the Corner",
    spotifyID: trackID,
    features: [],
    duration: 200000,
    rating,
    isrc,
    isrcLookedUp: true,
  });
}

const allTime = { from: null, to: new Date("2030-01-01T00:00:00Z") };

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("plays of two copies of a reviewed track rank as one track with its rating, and one album with its score", async () => {
  await seedReviewedTrack("reviewed-album", "reviewed-track", "USQE92400100", 9);
  await PlayModel.savePlays([
    play("reviewed-track", "2025-01-24T10:00:00Z", { albumID: "reviewed-album", albumName: "Imaginal Disk", isrc: "USQE92400100" }),
    play("copy-track", "2026-01-15T10:00:00Z", { albumID: "copy-album", albumName: "Imaginal Disk", isrc: "USQE92400100" }),
    play("copy-track", "2026-01-16T10:00:00Z", { albumID: "copy-album", albumName: "Imaginal Disk", isrc: "USQE92400100" }),
  ]);

  await PlayedGroupModel.groupAll();

  const tracks = await ListeningStatsModel.getTop("tracks", allTime);
  expect(tracks.map(entry => [entry.id, entry.plays, entry.score])).toEqual([["reviewed-track", 3, 9]]);
  const albums = await ListeningStatsModel.getTop("albums", allTime);
  expect(albums.map(entry => [entry.id, entry.plays, entry.score, entry.largeImageURL])).toEqual([["reviewed-album", 3, 80, "reviewed-640.jpg"]]);
});

test("a track played only as a copy links to the reviewed album and gets the rating", async () => {
  await seedReviewedTrack("reviewed-album", "reviewed-track", "USQE92400100", 9);
  await PlayModel.savePlays([play("copy-track", "2026-01-15T10:00:00Z", { albumID: "copy-album", albumName: "Imaginal Disk", isrc: "USQE92400100" })]);

  await PlayedGroupModel.groupAll();

  const [track] = await ListeningStatsModel.getTop("tracks", allTime);
  expect(track.score).toBe(9);
  expect(await ListeningStatsModel.getLink("tracks", track.id)).toEqual({ type: "album", id: "reviewed-album" });
});

test("an artist's albums played count each album once in the period, and leave out singles and compilations on their own", async () => {
  await PlayModel.savePlays([
    play("first", "2026-02-01T10:00:00Z", { albumID: "album", albumName: "Album", isrc: "QZAAA2600001" }),
    play("first-deluxe", "2026-02-02T10:00:00Z", { albumID: "album-deluxe", albumName: "Album (Deluxe)", isrc: "QZAAA2600001" }),
    play("first-single", "2026-02-03T10:00:00Z", { albumID: "single", albumType: "single", isrc: "QZAAA2600001" }),
    play("other-single", "2026-02-04T10:00:00Z", { albumID: "other-single", albumType: "single", isrc: "QZAAA2600002" }),
    play("best-of", "2026-02-05T10:00:00Z", { albumID: "best-of", albumType: "compilation", isrc: "QZAAA2600003" }),
    play("older", "2025-01-01T10:00:00Z", { albumID: "older-album", isrc: "QZAAA2500004" }),
  ]);

  await PlayedGroupModel.groupAll();

  const thisYear = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2027-01-01T00:00:00Z") };
  expect((await ListeningStatsModel.getTop("artists", thisYear))[0].albumCount).toBe(1);
  expect((await ListeningStatsModel.getTop("artists", allTime))[0].albumCount).toBe(2);
});
