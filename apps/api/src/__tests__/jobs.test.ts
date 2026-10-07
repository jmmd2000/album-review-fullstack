import { afterAll, test, expect, vi } from "vitest";
import type { Progress } from "@shared/types";
import { closeDatabase } from "@/db/client";
import { app } from "@/app";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { JobService } from "@/api/services/JobService";
import { ArtistModel } from "@/api/models/Artist";

const authCookie = adminCookie();

const progress = (index: number, total: number): Progress => ({ index, total, spotifyID: "jobTestArtistSpotify01", artistName: "Artist" });

afterAll(async () => {
  await closeDatabase();
});

test("job routes require admin", async () => {
  const res = await api.post("/api/jobs/artist-headers");
  expect(res.status).toBe(401);
});

test("spawning a header job streams its progress and completion", async () => {
  const spy = vi.spyOn(ArtistImageService, "updateArtistHeaders").mockImplementation(async (_all, _spotifyID, emit) => {
    emit("progress", progress(1, 2));
    emit("progress", progress(2, 2));
  });

  const created = await api.post("/api/jobs/artist-headers", undefined, authCookie);
  expect(created.status).toBe(202);
  const { jobID } = await created.json();

  const events = await api.get(`/api/jobs/${jobID}/events`, authCookie);
  expect(events.status).toBe(200);
  expect(events.headers.get("content-type")).toContain("text/event-stream");

  const text = await events.text();
  expect(text).toContain("event: progress");
  expect(text).toContain('"index":1');
  expect(text).toContain('"index":2');
  expect(text).toContain("event: done");

  spy.mockRestore();
});

test("spawning an image job streams the same way", async () => {
  const spy = vi.spyOn(ArtistImageService, "updateArtistImages").mockImplementation(async (_all, _spotifyID, emit) => {
    emit("progress", progress(1, 1));
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
  const res = await api.get("/api/jobs/00000000-0000-4000-8000-000000000000/events", authCookie);
  expect(res.status).toBe(404);
});

test("reconnecting with a last event id resumes after it", async () => {
  const jobID = JobService.create(async emit => {
    emit("fetching", progress(1, 1));
    emit("progress", progress(1, 1));
  });

  const res = await app.request(`/api/jobs/${jobID}/events`, {
    headers: { Cookie: authCookie, "Last-Event-ID": "0" },
  });
  const text = await res.text();

  expect(text).not.toContain("event: fetching");
  expect(text).toContain("event: progress");
  expect(text).toContain("event: done");
});

test("a second run of a job that is still going gets a 409 and doesn't start", async () => {
  // Both jobs wait on this list, so they stay running until the test releases it
  let releaseArtists: (artists: Awaited<ReturnType<typeof ArtistModel.getAllArtists>>) => void = () => {};
  const spy = vi.spyOn(ArtistModel, "getAllArtists").mockReturnValue(new Promise(resolve => (releaseArtists = resolve)));

  const first = await api.post("/api/jobs/artist-images", undefined, authCookie);
  expect(first.status).toBe(202);
  const { jobID } = await first.json();

  const second = await api.post("/api/jobs/artist-images", undefined, authCookie);
  expect(second.status).toBe(409);
  expect((await second.json()).message).toBe("The artist photos are already updating. Try again when that run finishes.");

  const otherJob = await api.post("/api/jobs/artist-headers", undefined, authCookie);
  expect(otherJob.status).toBe(202);
  const { jobID: otherJobID } = await otherJob.json();

  releaseArtists([]);
  await (await api.get(`/api/jobs/${jobID}/events`, authCookie)).text();
  await (await api.get(`/api/jobs/${otherJobID}/events`, authCookie)).text();
  expect(ArtistImageService.isRunning("images")).toBe(false);
  expect(ArtistImageService.isRunning("headers")).toBe(false);

  spy.mockRestore();
});
