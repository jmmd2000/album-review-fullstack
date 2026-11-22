import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { PlayModel } from "@/api/models/Play";
import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { ListeningService, timelineUnit } from "@/api/services/ListeningService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const play = (trackID: string, playedAt: string, artistID = "artist1"): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: trackID,
    duration_ms: 200000,
    artists: [{ id: artistID, name: artistID }],
    album: { id: "album1", name: "album1", release_date: "2024-01-01", images: [], artists: [{ id: artistID, name: artistID }] },
  },
});

const sunday = 6;

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

describe("Dublin time across the clock changes", () => {
  test("in March, the hour after 00:59 is 02:00", async () => {
    // 29 March 2026: 00:30 UTC is 00:30 GMT, and 01:30 UTC is 02:30 IST
    await PlayModel.savePlays([play("before", "2026-03-29T00:30:00Z"), play("after", "2026-03-29T01:30:00Z")]);

    const clock = await ListeningStatsModel.getClock({ from: null, to: new Date("2027-01-01T00:00:00Z") });

    expect(clock.plays[sunday][0]).toBe(1);
    expect(clock.plays[sunday][1]).toBe(0);
    expect(clock.plays[sunday][2]).toBe(1);
  });

  test("in October, 01:00 to 01:59 happens twice and both count as 1am", async () => {
    // 25 October 2026: 00:30 UTC is 01:30 IST, and 01:30 UTC is 01:30 GMT
    await PlayModel.savePlays([play("first", "2026-10-25T00:30:00Z"), play("second", "2026-10-25T01:30:00Z")]);

    const clock = await ListeningStatsModel.getClock({ from: null, to: new Date("2027-01-01T00:00:00Z") });

    expect(clock.plays[sunday][1]).toBe(2);
  });

  test("a play at 23:30 UTC in summer falls on the next Dublin day", async () => {
    await PlayModel.savePlays([play("late", "2026-10-24T23:30:00Z")]);

    const timeline = await ListeningStatsModel.getTimeline({ from: new Date("2026-10-23T23:00:00Z"), to: new Date("2026-10-26T00:00:00Z") }, "day");

    expect(timeline).toEqual([
      { start: "2026-10-24", plays: 0, minutes: 0 },
      { start: "2026-10-25", plays: 1, minutes: 3 },
    ]);
  });
});

test("weeks start on a Monday, and empty weeks are filled in", async () => {
  await PlayModel.savePlays([play("a", "2026-01-07T12:00:00Z"), play("b", "2026-01-21T12:00:00Z")]);

  const timeline = await ListeningStatsModel.getTimeline({ from: new Date("2026-01-05T00:00:00Z"), to: new Date("2026-01-25T00:00:00Z") }, "week");

  expect(timeline).toEqual([
    { start: "2026-01-05", plays: 1, minutes: 3 },
    { start: "2026-01-12", plays: 0, minutes: 0 },
    { start: "2026-01-19", plays: 1, minutes: 3 },
  ]);
});

test("an entry narrows the timeline and clock to its plays, and all time starts at its first play", async () => {
  await PlayModel.savePlays([play("other", "2026-01-05T10:00:00Z", "someone else"), play("mine", "2026-03-02T10:00:00Z"), play("mine", "2026-03-02T15:00:00Z")]);

  const overTime = await ListeningService.getOverTime("all", undefined, undefined, new Date("2026-03-04T12:00:00Z"), { kind: "artists", id: "artist1" });

  expect(overTime.timeline.map(bucket => bucket.start)[0]).toBe("2026-03-02");
  expect(overTime.timeline.reduce((total, bucket) => total + bucket.plays, 0)).toBe(2);
  expect(overTime.clock.plays.flat().reduce((total, plays) => total + plays, 0)).toBe(2);
});

test("picks days, weeks or months to suit the period's length", () => {
  const to = new Date("2026-12-31T00:00:00Z");
  expect(timelineUnit({ from: new Date("2026-12-03T00:00:00Z"), to }, null)).toBe("day");
  expect(timelineUnit({ from: new Date("2026-07-01T00:00:00Z"), to }, null)).toBe("week");
  expect(timelineUnit({ from: null, to }, new Date("2020-01-01T00:00:00Z"))).toBe("month");
});

test("the over-time route is for the admin only and answers both views", async () => {
  expect((await api.get("/api/listening/over-time")).status).toBe(401);

  const body = await (await api.get("/api/listening/over-time?period=all", adminCookie())).json();
  expect(body.clock.plays).toHaveLength(7);
  expect(body.timeline).toEqual([]);
});
