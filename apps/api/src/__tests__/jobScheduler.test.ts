import { afterEach, beforeEach, describe, test, expect, vi, type MockInstance } from "vitest";
import { JobScheduler, isRefreshDue } from "@/api/services/JobScheduler";
import { SettingsService } from "@/api/services/SettingsService";
import type { ScheduledJob } from "@/api/services/ScheduledJobs";
import * as errorReporting from "@/config/errorReporting";

const DAY_MS = 24 * 60 * 60 * 1000;
const threeAM = new Date("2026-10-12T03:00:00Z");
const daysBefore = (date: Date, days: number) => new Date(date.getTime() - days * DAY_MS);

let calls: string[];
let setLastRun: MockInstance<typeof SettingsService.setLastRun>;

const fakeJob = (name: string, run: ScheduledJob["run"] = async () => void calls.push(name)): ScheduledJob => ({
  name,
  settingName: name,
  busyMessage: `${name} is busy`,
  run,
});

beforeEach(() => {
  calls = [];
  setLastRun = vi.spyOn(SettingsService, "setLastRun").mockResolvedValue();
});

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

describe("runDueJobs", () => {
  test("checks each job against its own interval", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(daysBefore(threeAM, 5));
    vi.spyOn(SettingsService, "getIntervalDays").mockImplementation(async settingName => (settingName === "photos" ? 3 : 7));

    await JobScheduler.runDueJobs(threeAM, [fakeJob("photos"), fakeJob("headers")]);

    expect(calls).toEqual(["photos"]);
  });

  test("does nothing outside 3am", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(7);

    await JobScheduler.runDueJobs(new Date("2026-10-12T14:00:00Z"), [fakeJob("photos")]);

    expect(calls).toEqual([]);
  });

  test("runs the due jobs in list order", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(daysBefore(threeAM, 8));
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(7);

    await JobScheduler.runDueJobs(threeAM, [fakeJob("photos"), fakeJob("headers")]);

    expect(calls).toEqual(["photos", "headers"]);
  });

  test("runs only the job that is due", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockImplementation(async settingName => (settingName === "photos" ? daysBefore(threeAM, 2) : daysBefore(threeAM, 8)));
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(7);

    await JobScheduler.runDueJobs(threeAM, [fakeJob("photos"), fakeJob("headers")]);

    expect(calls).toEqual(["headers"]);
  });

  test("skips a job that a manual run already started", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(7);
    let finishManualRun = () => {};
    const photos = fakeJob("photos", async () => {
      calls.push("photos");
      await new Promise<void>(resolve => (finishManualRun = resolve));
    });

    expect(JobScheduler.runNow(photos)).not.toBeNull();
    expect(JobScheduler.runNow(photos)).toBeNull();
    await JobScheduler.runDueJobs(threeAM, [photos, fakeJob("headers")]);

    expect(calls).toEqual(["photos", "headers"]);
    finishManualRun();
    await vi.waitFor(() => expect(JobScheduler.isRunning("photos")).toBe(false));
  });

  test("a job that throws is reported, keeps its old last run time, and doesn't stop the next job", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(7);
    const report = vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});
    const error = new Error("spotify is down");
    const photos = fakeJob("photos", async () => {
      throw error;
    });

    await JobScheduler.runDueJobs(threeAM, [photos, fakeJob("headers")]);

    expect(calls).toEqual(["headers"]);
    expect(report).toHaveBeenCalledWith(error, { job: "photos" });
    expect(setLastRun.mock.calls.map(([settingName]) => settingName)).toEqual(["headers"]);
    expect(JobScheduler.isRunning("photos")).toBe(false);
  });

  test("does nothing when the interval is 0", async () => {
    vi.spyOn(SettingsService, "getLastRun").mockResolvedValue(null);
    vi.spyOn(SettingsService, "getIntervalDays").mockResolvedValue(0);

    await JobScheduler.runDueJobs(threeAM, [fakeJob("photos")]);

    expect(calls).toEqual([]);
  });
});
