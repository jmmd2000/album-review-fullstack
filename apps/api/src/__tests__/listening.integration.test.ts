import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import * as errorReporting from "@/config/errorReporting";
import { SpotifyClient, SpotifyNotConnectedError } from "@/api/models/SpotifyClient";
import { SpotifyUserTokenCache } from "@/api/models/SpotifyUserTokenCache";
import { ListeningService } from "@/api/services/ListeningService";
import { SettingsService } from "@/api/services/SettingsService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const play = (trackID: string, playedAt: string, albumID = "album1", artistIDs = ["artist1"]): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: `Track ${trackID}`,
    duration_ms: 200000,
    artists: artistIDs.map(id => ({ id, name: `Artist ${id}` })),
    album: { id: albumID, name: `Album ${albumID}`, release_date: "2024-01-01", images: [{ url: `${albumID}.jpg`, width: 640, height: 640 }], artists: [{ id: artistIDs[0], name: "Artist" }] },
  },
});

async function countRows(table: string): Promise<number> {
  const result = await query(`SELECT count(*)::int AS count FROM ${table}`);
  return result.rows[0].count;
}

beforeEach(async () => {
  await resetTables(query);
  vi.spyOn(SpotifyUserTokenCache, "getAccessToken").mockResolvedValue("user-token");
  // A collection that works clears the failure state a previous test left behind
  vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValueOnce([]);
  await ListeningService.collect();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("collecting the same plays twice saves them once", async () => {
  vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValue([play("track1", "2026-11-20T10:00:00.000Z"), play("track2", "2026-11-20T09:56:00.000Z")]);

  expect(await ListeningService.collect()).toEqual({ saved: 2 });
  expect(await ListeningService.collect()).toEqual({ saved: 0 });
  expect(await countRows("plays")).toBe(2);
});

test("plays of the same track share one track, album and artist row", async () => {
  vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValue([
    play("track1", "2026-11-20T10:00:00.000Z"),
    play("track1", "2026-11-20T09:56:00.000Z"),
    play("track2", "2026-11-20T09:50:00.000Z", "album1", ["artist1", "artist2"]),
  ]);

  expect(await ListeningService.collect()).toEqual({ saved: 3 });
  expect(await countRows("played_tracks")).toBe(2);
  expect(await countRows("played_albums")).toBe(1);
  expect(await countRows("played_artists")).toBe(2);
  expect(await countRows("played_track_artists")).toBe(3);
});

test("a later collection updates a track's album and credits instead of failing", async () => {
  const getRecentlyPlayed = vi.spyOn(SpotifyClient, "getRecentlyPlayed");
  getRecentlyPlayed.mockResolvedValueOnce([play("track1", "2026-11-20T10:00:00.000Z", "album1", ["artist1"])]);
  await ListeningService.collect();

  getRecentlyPlayed.mockResolvedValueOnce([play("track1", "2026-11-20T10:30:00.000Z", "album2", ["artist2", "artist1"])]);
  expect(await ListeningService.collect()).toEqual({ saved: 1 });

  const track = await query("SELECT album_spotify_id FROM played_tracks WHERE spotify_id = 'track1'");
  expect(track.rows[0].album_spotify_id).toBe("album2");
  const credit = await query("SELECT position FROM played_track_artists WHERE track_spotify_id = 'track1' AND artist_spotify_id = 'artist1'");
  expect(credit.rows[0].position).toBe(2);
});

test("a refused sign-in saves the error, is reported once, and stops scheduled collections", async () => {
  const report = vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});
  const getAccessToken = vi.spyOn(SpotifyUserTokenCache, "getAccessToken").mockRejectedValue(new SpotifyNotConnectedError());

  await ListeningService.collectOnSchedule();
  await ListeningService.collectOnSchedule();

  expect(getAccessToken).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledTimes(1);
  expect(await SettingsService.get("listening_last_error")).toBe("Spotify isn't connected.");
});

test("a run of failures is reported once, and a collection that works clears the error", async () => {
  const report = vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});
  const getRecentlyPlayed = vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockRejectedValue(new Error("Spotify fell over"));

  await ListeningService.collectOnSchedule();
  await ListeningService.collectOnSchedule();
  expect(getRecentlyPlayed).toHaveBeenCalledTimes(2);
  expect(report).toHaveBeenCalledTimes(1);

  getRecentlyPlayed.mockResolvedValue([]);
  await ListeningService.collectOnSchedule();
  expect(await SettingsService.get("listening_last_error")).toBeNull();
});

test("collecting while a collection runs waits for it instead of starting another", async () => {
  const getRecentlyPlayed = vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValue([play("track1", "2026-11-20T10:00:00.000Z")]);

  const results = await Promise.all([ListeningService.collect(), ListeningService.collect()]);

  expect(getRecentlyPlayed).toHaveBeenCalledTimes(1);
  expect(results).toEqual([{ saved: 1 }, { saved: 1 }]);
});

describe("the listening routes", () => {
  const authCookie = adminCookie();

  test("require admin", async () => {
    expect((await api.get("/api/listening")).status).toBe(401);
    expect((await api.post("/api/listening/collect")).status).toBe(401);
  });

  test("Collect now saves plays, and the status lists them newest first with their artists in credit order", async () => {
    vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValue([play("track2", "2026-11-20T10:00:00.000Z", "album1", ["artist2", "artist1"]), play("track1", "2026-11-20T09:56:00.000Z")]);

    const collected = await api.post("/api/listening/collect", undefined, authCookie);
    expect(await collected.json()).toEqual({ saved: 2 });

    const status = await (await api.get("/api/listening", authCookie)).json();
    expect(status.lastError).toBeNull();
    expect(status.lastCollected).not.toBeNull();
    expect(status.recentPlays.map((recent: { trackName: string; artistNames: string[] }) => [recent.trackName, recent.artistNames])).toEqual([
      ["Track track2", ["Artist artist2", "Artist artist1"]],
      ["Track track1", ["Artist artist1"]],
    ]);
  });

  test("Collect now answers 503 when Spotify isn't connected", async () => {
    vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});
    vi.spyOn(SpotifyUserTokenCache, "getAccessToken").mockRejectedValue(new SpotifyNotConnectedError());

    const response = await api.post("/api/listening/collect", undefined, authCookie);
    expect(response.status).toBe(503);
  });
});

test("saves each album's medium cover, and falls back to the only cover there is", async () => {
  const covers = (sizes: number[]) => sizes.map(size => ({ url: `${size}.jpg`, width: size, height: size }));
  const withCovers = (spotifyPlay: SpotifyPlay, sizes: number[]): SpotifyPlay => ({ ...spotifyPlay, track: { ...spotifyPlay.track, album: { ...spotifyPlay.track.album, images: covers(sizes) } } });
  vi.spyOn(SpotifyClient, "getRecentlyPlayed").mockResolvedValue([
    withCovers(play("track1", "2026-11-20T10:00:00.000Z", "album1"), [640, 300, 64]),
    withCovers(play("track2", "2026-11-20T09:56:00.000Z", "album2"), [640]),
    withCovers(play("track3", "2026-11-20T09:50:00.000Z", "album3"), []),
  ]);

  await ListeningService.collect();

  const status = await ListeningService.getStatus();
  expect(status.recentPlays.map(recent => recent.albumImageURL)).toEqual(["300.jpg", "640.jpg", null]);
});
