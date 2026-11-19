import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { SettingsService } from "@/api/services/SettingsService";

const authCookie = adminCookie();

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("settings routes require admin", async () => {
  const res = await api.get("/api/settings/last-runs");
  expect(res.status).toBe(401);
});

test("last runs start empty and reflect a recorded run", async () => {
  const empty = await api.get("/api/settings/last-runs", authCookie);
  expect(await empty.json()).toEqual({});

  const runDate = new Date("2026-01-02T03:04:05.000Z");
  await SettingsService.setLastRun("artist_images", runDate);

  const all = await api.get("/api/settings/last-runs", authCookie);
  expect(await all.json()).toEqual({ artist_images_last_run: runDate.toISOString() });

  const single = await api.get("/api/settings/last-runs/images", authCookie);
  expect(await single.json()).toEqual({ lastRun: runDate.toISOString() });
});

test("a last run that never happened comes back null", async () => {
  const res = await api.get("/api/settings/last-runs/headers", authCookie);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ lastRun: null });
});

test("the last run type is validated", async () => {
  const res = await api.get("/api/settings/last-runs/nonsense", authCookie);
  expect(res.status).toBe(400);
});

test("recalculating scores records the run", async () => {
  const res = await api.post("/api/settings/recalculate-scores", undefined, authCookie);
  expect(res.status).toBe(200);

  const lastRun = await SettingsService.getLastRun("artist_scores");
  expect(lastRun).not.toBeNull();
});

test("build info requires admin", async () => {
  const res = await api.get("/api/settings/build-info");
  expect(res.status).toBe(401);
});

test("build info reports the running versions", async () => {
  const res = await api.get("/api/settings/build-info", authCookie);
  expect(res.status).toBe(200);

  const info = await res.json();
  // Nothing bakes build args in a test run
  expect(info.api.sha).toBe("dev");
  expect(info.versions.node).toBe(process.version);
  expect(info.versions.postgres).toMatch(/^\d+\./);
  expect(info.versions.packages.hono).toMatch(/^\d+\./);
  expect(info.versions.packages["drizzle-orm"]).toMatch(/^\d+\./);
});

test("a job's interval is 7 days until one is saved, and a bad stored value falls back to 7", async () => {
  expect(await SettingsService.getIntervalDays("artist_images")).toBe(7);

  await SettingsService.set("artist_images_interval_days", "14");
  expect(await SettingsService.getIntervalDays("artist_images")).toBe(14);

  await SettingsService.set("artist_images_interval_days", "0");
  expect(await SettingsService.getIntervalDays("artist_images")).toBe(0);

  for (const bad of ["soon", "-3", "2.5"]) {
    await SettingsService.set("artist_images_interval_days", bad);
    expect(await SettingsService.getIntervalDays("artist_images")).toBe(7);
  }
});

test("saving one job's interval leaves the other jobs alone, and the reply says the schedule is off on this server", async () => {
  const before = await api.get("/api/settings/job-intervals", authCookie);
  expect(await before.json()).toEqual({ intervals: { "artist-images": 7, "artist-headers": 7 }, scheduleEnabled: false });

  const update = await api.put("/api/settings/job-intervals/artist-headers", { intervalDays: 14 }, authCookie);
  expect(update.status).toBe(200);

  const after = await api.get("/api/settings/job-intervals", authCookie);
  expect((await after.json()).intervals).toEqual({ "artist-images": 7, "artist-headers": 14 });
});

test("an interval that isn't a whole number of days from 0 to 365 is rejected", async () => {
  for (const intervalDays of [-1, 2.5, 366, "7"]) {
    const res = await api.put("/api/settings/job-intervals/artist-images", { intervalDays }, authCookie);
    expect(res.status).toBe(400);
  }
  expect(await SettingsService.getIntervalDays("artist_images")).toBe(7);
});

test("saving an interval for a job that isn't on the list returns 404", async () => {
  const res = await api.put("/api/settings/job-intervals/nonsense", { intervalDays: 7 }, authCookie);
  expect(res.status).toBe(404);
});
