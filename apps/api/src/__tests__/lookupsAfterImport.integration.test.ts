import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { JobScheduler } from "@/api/services/JobScheduler";
import { ListeningService } from "@/api/services/ListeningService";
import { PlayedArtistGenreService } from "@/api/services/PlayedArtistGenreService";
import { PlayedTrackLookupService } from "@/api/services/PlayedTrackLookupService";

beforeEach(async () => {
  await resetTables(query);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("runs the track lookup, then the genre lookup", async () => {
  const order: string[] = [];
  vi.spyOn(PlayedTrackLookupService, "lookUp").mockImplementation(async () => {
    order.push("tracks");
  });
  vi.spyOn(PlayedArtistGenreService, "lookUpGenres").mockImplementation(async () => {
    order.push("genres");
  });

  await ListeningService.lookUpAfterImport();

  expect(order).toEqual(["tracks", "genres"]);
});

test("runs the genre lookup even when the track lookup fails", async () => {
  vi.spyOn(PlayedTrackLookupService, "lookUp").mockRejectedValue(new Error("Spotify is busy"));
  const lookUpGenres = vi.spyOn(PlayedArtistGenreService, "lookUpGenres").mockResolvedValue();

  await ListeningService.lookUpAfterImport();

  expect(lookUpGenres).toHaveBeenCalledTimes(1);
});

test("a running lookup is listed with its job ID, so Settings can follow it after a refresh", async () => {
  let finish: () => void = () => {};
  vi.spyOn(PlayedArtistGenreService, "lookUpGenres").mockResolvedValue();
  vi.spyOn(PlayedTrackLookupService, "lookUp").mockReturnValue(new Promise<void>(resolve => (finish = resolve)));

  const lookups = ListeningService.lookUpAfterImport();
  await vi.waitFor(() => expect(JobScheduler.isRunning("played-tracks")).toBe(true));

  const running = await (await api.get("/api/jobs/running", adminCookie())).json();
  expect(running.running["played-tracks"]).toEqual(expect.any(String));

  finish();
  await lookups;
  expect(JobScheduler.getRunningJobIDs()).toEqual({});
});

test("an import saves when it ran, how many plays it saved and the dates it covered", async () => {
  vi.spyOn(ListeningService, "lookUpAfterImport").mockResolvedValue();

  await ListeningService.importPlays([
    { playedAt: new Date("2016-09-29T07:06:27Z"), msPlayed: 60000, trackSpotifyID: "a", trackName: "a" },
    { playedAt: new Date("2026-11-20T21:57:45Z"), msPlayed: 60000, trackSpotifyID: "b", trackName: "b" },
  ]);

  const status = await ListeningService.getStatus();
  expect(status.lastImport).toMatchObject({ saved: 2, from: new Date("2016-09-29T07:06:27Z"), to: new Date("2026-11-20T21:57:45Z") });
  expect(status.lastImport?.importedAt).toBeInstanceOf(Date);
});

test("the running jobs route is for the admin only", async () => {
  expect((await api.get("/api/jobs/running")).status).toBe(401);
});
