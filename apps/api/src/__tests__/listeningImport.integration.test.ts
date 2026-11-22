import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { PlayModel, type ImportedPlay, type ImportResult } from "@/api/models/Play";
import { ListeningService } from "@/api/services/ListeningService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const livePlay = (trackID: string, playedAt: string): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: `Track ${trackID}`,
    duration_ms: 200000,
    artists: [{ id: "artist1", name: "Artist" }],
    album: { id: "album1", name: "Album", release_date: "2024-01-01", images: [], artists: [{ id: "artist1", name: "Artist" }] },
  },
});

const importedPlay = (trackID: string, playedAt: string, msPlayed = 180000): ImportedPlay => ({
  playedAt: new Date(playedAt),
  msPlayed,
  trackSpotifyID: trackID,
  trackName: `Track ${trackID}`,
});

async function savedPlays(): Promise<string[]> {
  const result = await query("SELECT track_spotify_id, played_at, ms_played FROM plays ORDER BY played_at, track_spotify_id");
  return result.rows.map(row => `${row.track_spotify_id} ${row.played_at.toISOString()} ${row.ms_played}`);
}

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("replaces the saved plays inside the import's range and keeps the ones before and after it", async () => {
  await PlayModel.savePlays([livePlay("before", "2026-01-01T09:00:00.000Z"), livePlay("inside", "2026-01-10T09:00:00.000Z"), livePlay("after", "2026-02-01T09:00:00.000Z")]);

  const result = await PlayModel.replaceRange([importedPlay("imported", "2026-01-05T09:00:00.000Z"), importedPlay("imported", "2026-01-20T09:00:00.000Z")]);

  expect(result).toMatchObject({ removed: 1, saved: 2 });
  expect(await savedPlays()).toEqual([
    "before 2026-01-01T09:00:00.000Z null",
    "imported 2026-01-05T09:00:00.000Z 180000",
    "imported 2026-01-20T09:00:00.000Z 180000",
    "after 2026-02-01T09:00:00.000Z null",
  ]);
});

test("replaces a live play saved a fraction of a second after the import's last play, so the play isn't counted twice", async () => {
  await PlayModel.savePlays([livePlay("last", "2026-11-20T21:57:45.106Z"), livePlay("later", "2026-11-20T21:57:46.000Z")]);

  const result = await PlayModel.replaceRange([importedPlay("first", "2026-11-20T21:50:47.000Z"), importedPlay("last", "2026-11-20T21:57:45.000Z")]);

  expect(result).toMatchObject({ removed: 1, saved: 2 });
  expect(await savedPlays()).toEqual(["first 2026-11-20T21:50:47.000Z 180000", "last 2026-11-20T21:57:45.000Z 180000", "later 2026-11-20T21:57:46.000Z null"]);
  expect(await PlayModel.countInRange(new Date("2026-11-20T21:50:47.000Z"), new Date("2026-11-20T21:57:45.000Z"))).toBe(2);
});

test("running the same import twice leaves the same plays and tracks", async () => {
  const plays = [importedPlay("track1", "2026-01-05T09:00:00.000Z"), importedPlay("track2", "2026-01-06T09:00:00.000Z", 12000)];

  await PlayModel.replaceRange(plays);
  const playsAfterFirst = await savedPlays();
  const tracksAfterFirst = (await query("SELECT * FROM played_tracks ORDER BY spotify_id")).rows;

  expect(await PlayModel.replaceRange(plays)).toMatchObject({ removed: 2, saved: 2 });
  expect(await savedPlays()).toEqual(playsAfterFirst);
  expect((await query("SELECT * FROM played_tracks ORDER BY spotify_id")).rows).toEqual(tracksAfterFirst);
});

test("a track that is already saved keeps its album and length, and a new track gets only its name", async () => {
  await PlayModel.savePlays([livePlay("known", "2026-03-01T09:00:00.000Z")]);

  await PlayModel.replaceRange([{ ...importedPlay("known", "2026-01-05T09:00:00.000Z"), trackName: "A different name" }, importedPlay("new", "2026-01-06T09:00:00.000Z")]);

  const tracks = await query("SELECT spotify_id, name, duration_ms, album_spotify_id FROM played_tracks ORDER BY spotify_id");
  expect(tracks.rows).toEqual([
    { spotify_id: "known", name: "Track known", duration_ms: 200000, album_spotify_id: "album1" },
    { spotify_id: "new", name: "Track new", duration_ms: null, album_spotify_id: null },
  ]);
});

test("a play that appears twice in the import is saved once", async () => {
  const play = importedPlay("track1", "2026-01-05T09:00:00.000Z");

  expect(await PlayModel.replaceRange([play, { ...play }])).toMatchObject({ removed: 0, saved: 1 });
});

test("counts the saved plays in a range, both ends included", async () => {
  await PlayModel.savePlays([livePlay("track1", "2026-01-01T09:00:00.000Z"), livePlay("track2", "2026-01-02T09:00:00.000Z"), livePlay("track3", "2026-01-03T09:00:00.000Z")]);

  expect(await PlayModel.countInRange(new Date("2026-01-01T09:00:00.000Z"), new Date("2026-01-02T09:00:00.000Z"))).toBe(2);
});

describe("the import routes", () => {
  const authCookie = adminCookie();
  const body = { plays: [{ playedAt: "2026-01-05T09:00:00.000Z", msPlayed: 180000, trackSpotifyID: "track1", trackName: "Track 1" }] };

  beforeEach(() => {
    vi.spyOn(ListeningService, "lookUpAfterImport").mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("require admin", async () => {
    expect((await api.get("/api/listening/plays/count?from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z")).status).toBe(401);
    expect((await api.post("/api/listening/import", body)).status).toBe(401);
  });

  test("an import saves the plays, and the count route sees them", async () => {
    const imported = await api.post("/api/listening/import", body, authCookie);
    expect(await imported.json()).toMatchObject({ removed: 0, saved: 1 });

    const counted = await api.get("/api/listening/plays/count?from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z", authCookie);
    expect(await counted.json()).toEqual({ count: 1 });
  });

  test("a play without a track name is refused", async () => {
    const response = await api.post("/api/listening/import", { plays: [{ ...body.plays[0], trackName: "" }] }, authCookie);
    expect(response.status).toBe(400);
  });

  test("a second import while one runs is refused", async () => {
    let finish: (result: ImportResult) => void = () => {};
    vi.spyOn(PlayModel, "replaceRange").mockReturnValueOnce(new Promise(resolve => (finish = resolve)));

    const first = api.post("/api/listening/import", body, authCookie);
    await vi.waitFor(() => expect(PlayModel.replaceRange).toHaveBeenCalled());
    const second = await api.post("/api/listening/import", body, authCookie);
    finish({ removed: 0, saved: 1, from: null, to: null });

    expect(second.status).toBe(409);
    expect((await first).status).toBe(200);
  });
});
