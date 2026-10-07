import { afterAll, afterEach, describe, test, expect, vi } from "vitest";
import type { SpotifyAlbum, SpotifyArtist } from "@shared/types";
import { closeDatabase } from "@/db/client";
import { SpotifyService } from "@/api/services/SpotifyService";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { AlbumModel } from "@/api/models/Album";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { GenreModel } from "@/api/models/Genre";

vi.mock("@/helpers/getImageColors", () => ({
  getImageColors: vi.fn(() => Promise.resolve([])),
}));

// A raw Spotify album carrying only the fields the mapper actually reads.
const rawAlbum = (id: string, name: string): SpotifyAlbum =>
  ({
    id,
    name,
    artists: [{ id: `${id}-artist`, name: `${name} Artist` }],
    release_date: "2024-05-01",
    images: [{ url: `${id}.jpg`, height: 640, width: 640 }],
  }) as unknown as SpotifyAlbum;

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await closeDatabase();
});

describe("searchAlbums", () => {
  test("returns empty for a blank query without touching spotify", async () => {
    const tokenSpy = vi.spyOn(SpotifyTokenCache, "getAccessToken");

    expect(await SpotifyService.searchAlbums({ query: "   " })).toEqual([]);
    expect(await SpotifyService.searchAlbums({ query: "undefined" })).toEqual([]);
    expect(tokenSpy).not.toHaveBeenCalled();
  });

  test("enriches search hits with review and bookmark status", async () => {
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("tok");
    vi.spyOn(SpotifyClient, "searchAlbums").mockResolvedValue({ albums: { items: [rawAlbum("a1", "First"), rawAlbum("a2", "Second")] } });
    vi.spyOn(AlbumModel, "getFinalScoresByIds").mockResolvedValue([{ spotifyID: "a1", finalScore: 82 }]);
    vi.spyOn(BookmarkedAlbumModel, "getBookmarkedByIds").mockResolvedValue(["a2"]);

    const results = await SpotifyService.searchAlbums({ query: "anything" });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ spotifyID: "a1", finalScore: 82, bookmarked: false });
    expect(results[1]).toMatchObject({ spotifyID: "a2", finalScore: null, bookmarked: true });
  });

  test("skips the database reads when spotify returns nothing", async () => {
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("tok");
    vi.spyOn(SpotifyClient, "searchAlbums").mockResolvedValue({ albums: { items: [] } });
    const scoresSpy = vi.spyOn(AlbumModel, "getFinalScoresByIds");

    expect(await SpotifyService.searchAlbums({ query: "anything" })).toEqual([]);
    expect(scoresSpy).not.toHaveBeenCalled();
  });
});

describe("getAlbum", () => {
  test("throws a 409 when the album is already reviewed", async () => {
    vi.spyOn(AlbumModel, "findBySpotifyID").mockResolvedValue({ spotifyID: "alb" } as never);

    await expect(SpotifyService.getAlbum("alb")).rejects.toMatchObject({ status: 409 });
  });

  test("maps artist details onto the album and includes the genre list", async () => {
    vi.spyOn(AlbumModel, "findBySpotifyID").mockResolvedValue(undefined as never);
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("tok");
    vi.spyOn(SpotifyClient, "getAlbum").mockResolvedValue({
      id: "alb",
      name: "Album",
      images: [{ url: "img.jpg", height: 640, width: 640 }],
      artists: [
        { id: "a1", name: "One" },
        { id: "a2", name: "Two" },
      ],
    } as unknown as SpotifyAlbum);
    vi.spyOn(SpotifyClient, "getArtists").mockResolvedValue([{ id: "a1", images: [{ url: "a1.jpg", height: 300, width: 300 }] } as unknown as SpotifyArtist]);
    const genres = [{ id: 1, name: "Rock", slug: "rock" }];
    const genresSpy = vi.spyOn(GenreModel, "getAllGenres").mockResolvedValue(genres as never);

    const result = await SpotifyService.getAlbum("alb");

    expect(result.artists).toEqual([
      { spotifyID: "a1", name: "One", imageURLs: [{ url: "a1.jpg", height: 300, width: 300 }] },
      { spotifyID: "a2", name: "Two", imageURLs: [] },
    ]);
    expect(result.album.albumArtists).toEqual(result.artists);
    expect(result.genres).toEqual(genres);
    expect(genresSpy).toHaveBeenCalledTimes(1);
  });

  test("leaves genres out when includeGenres is false", async () => {
    vi.spyOn(AlbumModel, "findBySpotifyID").mockResolvedValue(undefined as never);
    vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("tok");
    vi.spyOn(SpotifyClient, "getAlbum").mockResolvedValue(rawAlbum("alb", "Album"));
    vi.spyOn(SpotifyClient, "getArtists").mockResolvedValue([]);
    const genresSpy = vi.spyOn(GenreModel, "getAllGenres");

    const result = await SpotifyService.getAlbum("alb", false);

    expect(result.genres).toBeUndefined();
    expect(genresSpy).not.toHaveBeenCalled();
  });
});
