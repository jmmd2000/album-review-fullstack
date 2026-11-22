import { afterAll, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { PlayModel } from "@/api/models/Play";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { GenreModel } from "@/api/models/Genre";
import { ArtistModel } from "@/api/models/Artist";
import { ListeningService } from "@/api/services/ListeningService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const now = new Date("2026-03-01T12:00:00Z");

const play = (trackID: string, playedAt: string, artistID = "artist1", albumID = "album1"): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: trackID,
    duration_ms: 200000,
    artists: [{ id: artistID, name: artistID }],
    album: { id: albumID, name: albumID, release_date: "2024-01-01", images: [{ url: `${albumID}.jpg`, width: 300, height: 300 }], artists: [{ id: artistID, name: artistID }] },
  },
});

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("gives an artist's first play and top tracks in the period", async () => {
  await PlayModel.savePlays([
    play("old", "2025-06-01T10:00:00Z"),
    play("hit", "2026-02-28T10:00:00Z"),
    play("hit", "2026-02-27T10:00:00Z"),
    play("deep-cut", "2026-02-20T10:00:00Z"),
    play("hit", "2025-12-10T10:00:00Z"),
  ]);

  const entry = await ListeningService.getEntry("artists", "artist1", "4-weeks", "plays", undefined, undefined, now);

  expect(entry.firstPlayedAt?.toISOString()).toBe("2025-06-01T10:00:00.000Z");
  expect(entry.topTracks.map(track => [track.name, track.plays])).toEqual([
    ["hit", 2],
    ["deep-cut", 1],
  ]);
});

test("by minutes, the top tracks are ordered by their minutes", async () => {
  const longPlay = play("long", "2026-02-25T10:00:00Z");
  await PlayModel.savePlays([play("hit", "2026-02-28T10:00:00Z"), play("hit", "2026-02-27T10:00:00Z"), { ...longPlay, track: { ...longPlay.track, duration_ms: 600000 } }]);

  const byPlays = await ListeningService.getEntry("artists", "artist1", "4-weeks", "plays", undefined, undefined, now);
  const byMinutes = await ListeningService.getEntry("artists", "artist1", "4-weeks", "minutes", undefined, undefined, now);

  expect(byPlays.topTracks.map(track => [track.name, track.plays, track.minutes])).toEqual([
    ["hit", 2, 7],
    ["long", 1, 10],
  ]);
  expect(byMinutes.topTracks.map(track => track.name)).toEqual(["long", "hit"]);
});

test("gives a genre's top artists and its share of all plays in the period", async () => {
  await PlayModel.savePlays([
    play("a", "2026-02-28T10:00:00Z", "rocker"),
    play("b", "2026-02-28T11:00:00Z", "rocker"),
    play("c", "2026-02-28T12:00:00Z", "popper"),
    play("d", "2026-02-28T13:00:00Z", "popper"),
  ]);
  const rock = await GenreModel.createGenre({ name: "Rock", slug: "rock" });
  await PlayedTrackModel.saveGenres("rocker", [rock.id]);

  const entry = await ListeningService.getEntry("genres", String(rock.id), "4-weeks", "plays", undefined, undefined, now);

  expect(entry.share).toBe(0.5);
  expect(entry.topArtists.map(artist => [artist.name, artist.plays])).toEqual([["rocker", 2]]);
});

test("a track shows the top tracks of its album in the period", async () => {
  await PlayModel.savePlays([play("single", "2026-02-28T10:00:00Z"), play("album-cut", "2026-02-27T10:00:00Z"), play("album-cut", "2026-02-26T10:00:00Z")]);

  const entry = await ListeningService.getEntry("tracks", "single", "4-weeks", "plays", undefined, undefined, now);

  expect(entry.topTracks.map(track => [track.name, track.plays])).toEqual([
    ["album-cut", 2],
    ["single", 1],
  ]);
});

test("links a reviewed artist to its page and an unreviewed one to a search, and a track to its album to review", async () => {
  await PlayModel.savePlays([play("track1", "2026-02-28T10:00:00Z", "reviewed"), play("track2", "2026-02-28T11:00:00Z", "unreviewed", "album2")]);
  await ArtistModel.createArtist({ spotifyID: "reviewed", name: "reviewed", imageURLs: [], headerImage: null, totalScore: 0, reviewCount: 1, unrated: false, leaderboardPosition: null });

  expect((await ListeningService.getEntry("artists", "reviewed", "all", "plays")).link).toEqual({ type: "artist", id: "reviewed" });
  expect((await ListeningService.getEntry("artists", "unreviewed", "all", "plays")).link).toEqual({ type: "search", query: "unreviewed" });
  expect((await ListeningService.getEntry("tracks", "track2", "all", "plays")).link).toEqual({ type: "review", id: "album2" });
});

test("the entry route is for the admin only", async () => {
  expect((await api.get("/api/listening/entry?kind=artists&id=artist1")).status).toBe(401);
  expect((await api.get("/api/listening/entry?kind=artists&id=artist1", adminCookie())).status).toBe(200);
});
