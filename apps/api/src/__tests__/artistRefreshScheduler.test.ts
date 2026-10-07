import { afterEach, describe, test, expect, vi } from "vitest";
import { ArtistRefreshScheduler, isRefreshDue } from "@/api/services/ArtistRefreshScheduler";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { SettingsService } from "@/api/services/SettingsService";

const DAY_MS = 24 * 60 * 60 * 1000;
const threeAM = new Date("2026-10-12T03:00:00Z");
const daysBefore = (date: Date, days: number) => new Date(date.getTime() - days * DAY_MS);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isRefreshDue", () => {
  test("a job that never ran is due", () => {
    expect(isRefreshDue(null, 7, threeAM)).toBe(true);
  });

  test("an interval of 0 days is never due", () => {
    expect(isRefreshDue(null, 0, threeAM)).toBe(false);
    expect(isRefreshDue(daysBefore(threeAM, 365), 0, threeAM)).toBe(false);
  });

  test("a run that finished a few minutes after 3am is due at 3am a week later", () => {
    const lastRun = new Date("2026-10-05T03:06:00Z");
    expect(isRefreshDue(lastRun, 7, threeAM)).toBe(true);
  });

  test("a run from 6 days ago is not due on a 7 day interval", () => {
    expect(isRefreshDue(daysBefore(threeAM, 6), 7, threeAM)).toBe(false);
  });
});

describe("runDueRefreshes", () => {
  const mockJobs = () => {
    const calls: string[] = [];
    const images = vi.spyOn(ArtistImageService, "updateArtistImages").mockImplementation(async () => void calls.push("images"));
    const headers = vi.spyOn(ArtistImageService, "updateArtistHeaders").mockImplementation(async () => void calls.push("headers"));
    return { calls, images, headers };
  };

  test("does nothing outside 3am", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(7);
    const { calls } = mockJobs();

    await ArtistRefreshScheduler.runDueRefreshes(new Date("2026-10-12T14:00:00Z"));

    expect(calls).toEqual([]);
  });

  test("runs the photo refresh and then the header refresh when both are due", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(daysBefore(threeAM, 8));
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(7);
    const { calls } = mockJobs();

    await ArtistRefreshScheduler.runDueRefreshes(threeAM);

    expect(calls).toEqual(["images", "headers"]);
  });

  test("runs only the job that is due", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockImplementation(async job => (job === "images" ? daysBefore(threeAM, 2) : daysBefore(threeAM, 8)));
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(7);
    const { calls } = mockJobs();

    await ArtistRefreshScheduler.runDueRefreshes(threeAM);

    expect(calls).toEqual(["headers"]);
  });

  test("skips a job that a manual run already started", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(7);
    vi.spyOn(ArtistImageService, "isRunning").mockImplementation(job => job === "images");
    const { calls } = mockJobs();

    await ArtistRefreshScheduler.runDueRefreshes(threeAM);

    expect(calls).toEqual(["headers"]);
  });

  test("a photo refresh that throws doesn't stop the header refresh", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(7);
    const { images, headers } = mockJobs();
    images.mockRejectedValue(new Error("spotify is down"));

    await ArtistRefreshScheduler.runDueRefreshes(threeAM);

    expect(headers).toHaveBeenCalledTimes(1);
  });

  test("does nothing when the interval is 0", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getRefreshIntervalDays").mockResolvedValue(0);
    const { calls } = mockJobs();

    await ArtistRefreshScheduler.runDueRefreshes(threeAM);

    expect(calls).toEqual([]);
  });
});
