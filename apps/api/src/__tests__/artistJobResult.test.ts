import { afterAll, afterEach, beforeEach, test, expect, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { ArtistModel } from "@/api/models/Artist";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { SettingsService } from "@/api/services/SettingsService";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import type { JobEmit } from "@/api/services/JobService";

vi.mock("@/helpers/fetchArtistFromSpotify", () => ({ fetchArtistFromSpotify: vi.fn() }));

const authCookie = adminCookie();
const photo = (url: string) => ({ url, height: 640, width: 640 });

// Four artists, one for each way a photo refresh can end
const artists = [
  { spotifyID: "unchangedArtistNumber1", name: "Unchanged", imageURLs: [photo("same.jpg")] },
  { spotifyID: "updatedArtistNumberTwo", name: "Updated", imageURLs: [photo("old.jpg")] },
  { spotifyID: "unreadableArtistNumber", name: "Unreadable", imageURLs: [photo("old.jpg")] },
  { spotifyID: "failedWriteArtistNumbr", name: "Failed write", imageURLs: [photo("old.jpg")] },
];

beforeEach(async () => {
  await resetTables(query);
  vi.spyOn(ArtistModel, "getAllArtists").mockResolvedValue(artists as never);
  vi.mocked(fetchArtistFromSpotify).mockImplementation(async id => {
    if (id === "unreadableArtistNumber") return null;
    const url = id === "unchangedArtistNumber1" ? "same.jpg" : "new.jpg";
    return { id, name: "Artist", images: [photo(url)] };
  });
  vi.spyOn(ArtistModel, "updateArtist").mockImplementation(async id => {
    if (id === "failedWriteArtistNumbr") throw new Error("the db is down");
    return undefined as never;
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("a photo refresh counts each artist once and saves how the run went", async () => {
  const events: string[] = [];
  const emit: JobEmit = (event, data) => {
    if (event === "changed" || event === "failed" || event === "same") events.push(`${event}:${(data as { artistName: string }).artistName}`);
  };

  await ArtistImageService.updateArtistImages(true, undefined, emit, "manual");

  expect(events).toEqual(["same:Unchanged", "changed:Updated", "failed:Unreadable", "failed:Failed write"]);
  const { images } = await SettingsService.getJobResults();
  expect(images).toMatchObject({ source: "manual", updated: 1, unchanged: 1, failed: 2, stoppedEarly: false });
});

test("a run that throws is saved as stopped early, and the error still reaches the caller", async () => {
  vi.spyOn(ArtistModel, "getAllArtists").mockRejectedValue(new Error("the db is down"));

  await expect(ArtistImageService.updateArtistImages(true, undefined, () => {}, "scheduled")).rejects.toThrow("the db is down");

  const { images } = await SettingsService.getJobResults();
  expect(images).toMatchObject({ source: "scheduled", stoppedEarly: true });
});

test("GET /api/settings/job-results gives each job's latest result, and null for a job that never ran", async () => {
  await ArtistImageService.updateArtistImages(true, undefined, () => {}, "scheduled");

  const res = await api.get("/api/settings/job-results", authCookie);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.images).toMatchObject({ source: "scheduled", updated: 1, unchanged: 1, failed: 2 });
  expect(body.headers).toBeNull();
});

test("a stored result the app can't read gives null", async () => {
  await SettingsService.set("artist_images_last_result", "not json");
  await SettingsService.set("artist_headers_last_result", JSON.stringify({ source: "nobody" }));

  expect(await SettingsService.getJobResults()).toEqual({ images: null, headers: null });
});
