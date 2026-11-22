import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { PlayModel } from "@/api/models/Play";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { GenreModel } from "@/api/models/Genre";
import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { ListeningService } from "@/api/services/ListeningService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const play = (trackID: string, playedAt: string, artistIDs: string[] = ["artist1"], durationMs = 200000): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: trackID,
    duration_ms: durationMs,
    artists: artistIDs.map(id => ({ id, name: id })),
    album: { id: `album-${trackID}`, name: `album-${trackID}`, release_date: "2024-01-01", images: [], artists: [{ id: artistIDs[0], name: artistIDs[0] }] },
  },
});

const allTime = { from: null, to: new Date("2030-01-01T00:00:00Z") };
const names = (entries: { name: string }[]) => entries.map(entry => entry.name);

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("counts plays of unknown length and plays of 30 seconds or more, and ranks by plays, then minutes, then name", async () => {
  await PlayModel.savePlays([
    play("long", "2026-01-01T10:00:00Z", ["artist1"], 400000),
    play("aaa-short", "2026-01-01T11:00:00Z", ["artist1"], 50000),
    play("beta", "2026-01-01T12:00:00Z", ["artist1"], 100000),
    play("alpha", "2026-01-01T13:00:00Z", ["artist1"], 100000),
  ]);
  await PlayModel.replaceRange([
    { playedAt: new Date("2025-01-01T10:00:00Z"), msPlayed: 29999, trackSpotifyID: "skipped", trackName: "skipped" },
    { playedAt: new Date("2025-01-01T11:00:00Z"), msPlayed: 30000, trackSpotifyID: "long", trackName: "long" },
  ]);

  const top = await ListeningStatsModel.getTop("tracks", allTime);

  expect(top.map(entry => [entry.name, entry.plays])).toEqual([
    ["long", 2],
    ["alpha", 1],
    ["beta", 1],
    ["aaa-short", 1],
  ]);
  expect(top[0].minutes).toBe(7);
});

test("a play with two artists counts for each, but only once for a genre they share", async () => {
  await PlayModel.savePlays([play("duet", "2026-01-01T10:00:00Z", ["artist1", "artist2"])]);
  const rock = await GenreModel.createGenre({ name: "Rock", slug: "rock" });
  await PlayedTrackModel.saveGenres("artist1", [rock.id]);
  await PlayedTrackModel.saveGenres("artist2", [rock.id]);

  expect((await ListeningStatsModel.getTop("artists", allTime)).map(entry => entry.plays)).toEqual([1, 1]);
  const genres = await ListeningStatsModel.getTop("genres", allTime);
  expect(genres.map(entry => [entry.name, entry.plays, entry.artistNames])).toEqual([["Rock", 1, ["artist1", "artist2"]]]);
});

test("each entry's change compares its rank with the period before, and all time has no change", async () => {
  const now = new Date("2026-03-01T12:00:00Z");
  await PlayModel.savePlays([
    play("climber", "2026-01-10T10:00:00Z"),
    play("faller", "2026-01-10T11:00:00Z"),
    play("faller", "2026-01-11T11:00:00Z"),
    play("climber", "2026-02-20T10:00:00Z"),
    play("climber", "2026-02-21T10:00:00Z"),
    play("faller", "2026-02-20T11:00:00Z"),
    play("fresh", "2026-02-22T11:00:00Z"),
  ]);

  const fourWeeks = await ListeningService.getTop("tracks", "4-weeks", undefined, undefined, now);
  expect(fourWeeks.entries.map(entry => [entry.name, entry.change])).toEqual([
    ["climber", 1],
    ["faller", -1],
    ["fresh", "new"],
  ]);

  const allTimeTop = await ListeningService.getTop("tracks", "all", undefined, undefined, now);
  expect(allTimeTop.entries.every(entry => entry.change === null)).toBe(true);
});

test("ranking by minutes puts the longest listened first, and the change compares minutes ranks", async () => {
  const now = new Date("2026-03-01T12:00:00Z");
  await PlayModel.savePlays([
    // The period before: "short" leads on plays, "long" on minutes
    play("long", "2026-01-20T10:00:00Z", ["artist1"], 600000),
    play("short", "2026-01-20T11:00:00Z", ["artist1"], 60000),
    play("short", "2026-01-21T11:00:00Z", ["artist1"], 60000),
    // This period: "short" has more plays, "long" more minutes
    play("short", "2026-02-20T10:00:00Z", ["artist1"], 60000),
    play("short", "2026-02-21T10:00:00Z", ["artist1"], 60000),
    play("long", "2026-02-22T10:00:00Z", ["artist1"], 600000),
  ]);

  const byPlays = await ListeningService.getTop("tracks", "4-weeks", undefined, undefined, now, "plays");
  const byMinutes = await ListeningService.getTop("tracks", "4-weeks", undefined, undefined, now, "minutes");

  expect(byPlays.entries.map(entry => entry.name)).toEqual(["short", "long"]);
  expect(byMinutes.entries.map(entry => [entry.name, entry.change])).toEqual([
    ["long", 0],
    ["short", 0],
  ]);
});

test("the full list goes past the top 50", async () => {
  await PlayModel.savePlays(Array.from({ length: 55 }, (_, index) => play(`track${index}`, `2026-01-01T10:${String(index).padStart(2, "0")}:00Z`)));

  expect((await ListeningService.getTop("tracks", "all")).entries).toHaveLength(50);
  expect((await ListeningService.getTop("tracks", "all", undefined, undefined, new Date(), "plays", true)).entries).toHaveLength(55);
});

test("a custom period runs from midnight to midnight in Dublin time", async () => {
  // 23:30 UTC on 30 June is 00:30 on 1 July in Dublin
  await PlayModel.savePlays([play("first-of-july", "2026-06-30T23:30:00Z"), play("thirtieth", "2026-06-30T22:30:00Z")]);

  const july = await ListeningService.getTop("tracks", "custom", "2026-07-01", "2026-07-01");
  expect(names(july.entries)).toEqual(["first-of-july"]);
  expect(july.totals).toEqual({ plays: 1, minutes: 3, artists: 1 });
});

test("4 weeks runs from Dublin midnight 27 days ago to now", async () => {
  const period = await ListeningStatsModel.resolvePeriod("4-weeks", new Date("2026-07-29T12:00:00Z"));

  expect(period.from?.toISOString()).toBe("2026-07-01T23:00:00.000Z");
  expect(period.to.toISOString()).toBe("2026-07-29T12:00:00.000Z");
});

describe("the top route", () => {
  const authCookie = adminCookie();

  test("is for the admin only", async () => {
    expect((await api.get("/api/listening/top?kind=artists")).status).toBe(401);
  });

  test("refuses a custom period without dates", async () => {
    expect((await api.get("/api/listening/top?kind=artists&period=custom", authCookie)).status).toBe(400);
  });

  test("answers with the totals and entries", async () => {
    await PlayModel.savePlays([play("track1", new Date().toISOString())]);

    const body = await (await api.get("/api/listening/top?kind=artists", authCookie)).json();
    expect(body.totals).toEqual({ plays: 1, minutes: 3, artists: 1 });
    expect(body.entries.map((entry: { name: string; change: unknown }) => [entry.name, entry.change])).toEqual([["artist1", "new"]]);
  });
});
