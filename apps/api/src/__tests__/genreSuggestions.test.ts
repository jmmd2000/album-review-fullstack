import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { closeDatabase } from "@/db/client";
import { GenreSuggestionService } from "@/api/services/GenreSuggestionService";
import { MusicBrainzClient } from "@/api/models/MusicBrainzClient";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { GenreModel } from "@/api/models/Genre";
import type { SpotifyAlbumResponse } from "@/api/schemas/spotifySchema";

vi.mock("@/helpers/sleep", () => ({ sleep: vi.fn(() => Promise.resolve()) }));

const ALBUM_ID = "3HHNR44YbP7XogMVwzbodx";

const spotifyAlbum: SpotifyAlbumResponse = {
  id: ALBUM_ID,
  name: "Twelve Carat Toothache",
  uri: `spotify:album:${ALBUM_ID}`,
  release_date: "2022-06-03",
  images: [],
  artists: [{ id: "artist", name: "Post Malone" }],
  external_ids: { upc: "00602445988471" },
  tracks: { items: [] },
};

const jsonResponse = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as Response;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await closeDatabase();
});

describe("GenreSuggestionService", () => {
  beforeEach(() => {
    vi.spyOn(GenreModel, "getGenreCounts").mockResolvedValue([
      { name: "hip-hop", slug: "hip-hop", albumCount: 9 },
      { name: "pop rap", slug: "pop-rap", albumCount: 4 },
    ]);
    vi.spyOn(MusicBrainzClient, "getReleaseGroupGenres").mockResolvedValue([
      { name: "hip hop", count: 3 },
      { name: "pop rap", count: 2 },
      { name: "cloud rap", count: 1 },
    ]);
  });

  test("finds the album by its Spotify link without asking Spotify, and matches the genres", async () => {
    vi.spyOn(MusicBrainzClient, "findReleaseBySpotifyLink").mockResolvedValue("release-1");
    const spotifySpy = vi.spyOn(SpotifyClient, "getAlbum");

    expect(await GenreSuggestionService.getSuggestions(ALBUM_ID)).toEqual({
      suggestions: [
        { name: "hip-hop", isNew: false },
        { name: "pop rap", isNew: false },
        { name: "cloud rap", isNew: true },
      ],
    });
    expect(spotifySpy).not.toHaveBeenCalled();
  });

  test("falls back to the barcode, then to the title and artist", async () => {
    vi.spyOn(MusicBrainzClient, "findReleaseBySpotifyLink").mockResolvedValue(null);
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("token");
    vi.spyOn(SpotifyClient, "getAlbum").mockResolvedValue(spotifyAlbum);
    const barcodeSpy = vi.spyOn(MusicBrainzClient, "findReleaseByBarcode").mockResolvedValue(null);
    const titleSpy = vi.spyOn(MusicBrainzClient, "findReleaseByTitle").mockResolvedValue("release-by-title");

    const result = await GenreSuggestionService.getSuggestions(ALBUM_ID);

    expect(barcodeSpy).toHaveBeenCalledWith("00602445988471", expect.anything());
    expect(titleSpy).toHaveBeenCalledWith("Twelve Carat Toothache", "Post Malone", expect.anything());
    expect(MusicBrainzClient.getReleaseGroupGenres).toHaveBeenCalledWith("release-by-title", expect.anything());
    expect(result.suggestions).toHaveLength(3);
  });

  test("returns at most 8 suggestions", async () => {
    vi.spyOn(MusicBrainzClient, "findReleaseBySpotifyLink").mockResolvedValue("release-1");
    vi.spyOn(MusicBrainzClient, "getReleaseGroupGenres").mockResolvedValue(Array.from({ length: 12 }, (_, index) => ({ name: `genre ${index}`, count: 12 - index })));

    expect((await GenreSuggestionService.getSuggestions(ALBUM_ID)).suggestions).toHaveLength(8);
  });

  test("returns no suggestions when MusicBrainz fails or finds nothing", async () => {
    vi.spyOn(MusicBrainzClient, "findReleaseBySpotifyLink").mockRejectedValueOnce(new Error("MusicBrainz answered 503"));
    expect(await GenreSuggestionService.getSuggestions(ALBUM_ID)).toEqual({ suggestions: [] });

    vi.spyOn(MusicBrainzClient, "findReleaseBySpotifyLink").mockResolvedValue(null);
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("token");
    vi.spyOn(SpotifyClient, "getAlbum").mockResolvedValue(spotifyAlbum);
    vi.spyOn(MusicBrainzClient, "findReleaseByBarcode").mockResolvedValue(null);
    vi.spyOn(MusicBrainzClient, "findReleaseByTitle").mockResolvedValue(null);
    expect(await GenreSuggestionService.getSuggestions(ALBUM_ID)).toEqual({ suggestions: [] });
  });
});

describe("MusicBrainzClient", () => {
  const signal = new AbortController().signal;

  test("names the app in every request and reads a link lookup", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ relations: [{}, { release: { id: "release-1" } }] }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await MusicBrainzClient.findReleaseBySpotifyLink(ALBUM_ID, signal)).toBe("release-1");
    expect(fetchMock.mock.calls[0][1].headers["User-Agent"]).toMatch(/^AlbumReviews\/\d+\.\d+\.\d+ \( https:\/\/jamesreviewsmusic\.com \)$/);
  });

  test("treats a 404 as nothing found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "Not Found" }, 404)));

    expect(await MusicBrainzClient.findReleaseBySpotifyLink(ALBUM_ID, signal)).toBeNull();
  });

  test("tries a 503 once more, and gives up after a second 503", async () => {
    const busy = jsonResponse({ error: "busy" }, 503);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(busy)
      .mockResolvedValueOnce(jsonResponse({ releases: [{ id: "release-1", score: 100 }] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await MusicBrainzClient.findReleaseByBarcode("1", signal)).toBe("release-1");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(busy));
    await expect(MusicBrainzClient.findReleaseByBarcode("1", signal)).rejects.toThrow("503");
  });

  test("only accepts a title match that scores 90 or more", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ releases: [{ id: "weak", score: 72 }] })));

    expect(await MusicBrainzClient.findReleaseByTitle('Say "Yes"', "Artist", signal)).toBeNull();
  });

  test("waits between calls, so it sends at most one a second", async () => {
    const { sleep } = await import("@/helpers/sleep");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ releases: [] })));

    await Promise.all([MusicBrainzClient.findReleaseByBarcode("1", signal), MusicBrainzClient.findReleaseByBarcode("2", signal)]);

    expect(sleep).toHaveBeenCalledWith(expect.any(Number));
    const waits = vi.mocked(sleep).mock.calls;
    expect(waits[waits.length - 1][0]).toBeGreaterThan(900);
  });
});
