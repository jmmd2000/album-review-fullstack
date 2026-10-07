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

test("reading a setting that was never written returns null", async () => {
  const res = await api.get("/api/settings/setting/some-key", authCookie);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ key: "some-key", value: null });
});

test("a setting can be written and read back", async () => {
  const put = await api.put("/api/settings/setting/theme", { value: "dark" }, authCookie);
  expect(put.status).toBe(200);

  const get = await api.get("/api/settings/setting/theme", authCookie);
  expect(await get.json()).toEqual({ key: "theme", value: "dark" });
});

test("writing a setting overwrites the previous value", async () => {
  await api.put("/api/settings/setting/theme", { value: "dark" }, authCookie);
  await api.put("/api/settings/setting/theme", { value: "light" }, authCookie);

  const get = await api.get("/api/settings/setting/theme", authCookie);
  expect(await get.json()).toEqual({ key: "theme", value: "light" });
});

test("writing a setting without a value is rejected", async () => {
  const res = await api.put("/api/settings/setting/theme", {}, authCookie);
  expect(res.status).toBe(400);
});

test("last runs start empty and reflect a recorded run", async () => {
  const empty = await api.get("/api/settings/last-runs", authCookie);
  expect(await empty.json()).toEqual({});

  const runDate = new Date("2026-01-02T03:04:05.000Z");
  await SettingsService.setLastRun("images", runDate);

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

  const lastRun = await SettingsService.getLastRun("scores");
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

test("the refresh interval is 7 days until one is saved, and a bad stored value falls back to 7", async () => {
  expect(await SettingsService.getRefreshIntervalDays()).toBe(7);

  await SettingsService.set("artist_refresh_interval_days", "14");
  expect(await SettingsService.getRefreshIntervalDays()).toBe(14);

  await SettingsService.set("artist_refresh_interval_days", "0");
  expect(await SettingsService.getRefreshIntervalDays()).toBe(0);

  for (const bad of ["soon", "-3", "2.5"]) {
    await SettingsService.set("artist_refresh_interval_days", bad);
    expect(await SettingsService.getRefreshIntervalDays()).toBe(7);
  }
});

test("the refresh interval can be read and changed, and says the schedule is off on this server", async () => {
  const before = await api.get("/api/settings/refresh-interval", authCookie);
  expect(await before.json()).toEqual({ intervalDays: 7, scheduleEnabled: false });

  const update = await api.put("/api/settings/refresh-interval", { intervalDays: 14 }, authCookie);
  expect(update.status).toBe(200);

  const after = await api.get("/api/settings/refresh-interval", authCookie);
  expect((await after.json()).intervalDays).toBe(14);
});

test("a refresh interval that isn't a whole number of days from 0 to 365 is rejected", async () => {
  for (const intervalDays of [-1, 2.5, 366, "7"]) {
    const res = await api.put("/api/settings/refresh-interval", { intervalDays }, authCookie);
    expect(res.status).toBe(400);
  }
  expect(await SettingsService.getRefreshIntervalDays()).toBe(7);
});
