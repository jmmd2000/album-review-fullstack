import { afterAll, test, expect, vi } from "vitest";
import { closeDatabase } from "@/db/client";
import { app } from "@/app";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { JobService } from "@/api/services/JobService";

const authCookie = adminCookie();

afterAll(async () => {
  await closeDatabase();
});

test("job routes require admin", async () => {
  const res = await api.post("/api/jobs/artist-headers");
  expect(res.status).toBe(401);
});

test("spawning a header job streams its progress and completion", async () => {
  const spy = vi.spyOn(ArtistImageService, "updateArtistHeaders").mockImplementation(async (_all, _spotifyID, emit) => {
    emit("progress", { done: 1, total: 2 });
    emit("progress", { done: 2, total: 2 });
  });

  const created = await api.post("/api/jobs/artist-headers", undefined, authCookie);
  expect(created.status).toBe(202);
  const { jobID } = await created.json();

  const events = await api.get(`/api/jobs/${jobID}/events`, authCookie);
  expect(events.status).toBe(200);
  expect(events.headers.get("content-type")).toContain("text/event-stream");

  const text = await events.text();
  expect(text).toContain("event: progress");
  expect(text).toContain('"done":1');
  expect(text).toContain('"done":2');
  expect(text).toContain("event: done");

  spy.mockRestore();
});

test("spawning an image job streams the same way", async () => {
  const spy = vi.spyOn(ArtistImageService, "updateArtistImages").mockImplementation(async (_all, _spotifyID, emit) => {
    emit("progress", { done: 1, total: 1 });
  });

  const created = await api.post("/api/jobs/artist-images", undefined, authCookie);
  expect(created.status).toBe(202);
  const { jobID } = await created.json();

  const text = await (await api.get(`/api/jobs/${jobID}/events`, authCookie)).text();
  expect(text).toContain("event: progress");
  expect(text).toContain("event: done");

  spy.mockRestore();
});

test("a job that throws surfaces a fatal event before finishing", async () => {
  const spy = vi.spyOn(ArtistImageService, "updateArtistHeaders").mockRejectedValue(new Error("boom"));

  const created = await api.post("/api/jobs/artist-headers", undefined, authCookie);
  const { jobID } = await created.json();

  const text = await (await api.get(`/api/jobs/${jobID}/events`, authCookie)).text();
  expect(text).toContain("event: fatal");
  expect(text).toContain("boom");
  expect(text).toContain("event: done");

  spy.mockRestore();
});

test("unknown job ids return 404", async () => {
  const res = await api.get("/api/jobs/not-a-job/events", authCookie);
  expect(res.status).toBe(404);
});

test("reconnecting with a last event id resumes after it", async () => {
  const jobID = JobService.create(async emit => {
    emit("first");
    emit("second");
  });

  const res = await app.request(`/api/jobs/${jobID}/events`, {
    headers: { Cookie: authCookie, "Last-Event-ID": "0" },
  });
  const text = await res.text();

  expect(text).not.toContain("event: first");
  expect(text).toContain("event: second");
  expect(text).toContain("event: done");
});
