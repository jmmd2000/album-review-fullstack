import { describe, test, expect } from "vitest";
import type { SpotifyAlbumSearchItem } from "@/api/schemas/spotifySchema";
import { mapSearchResults, enrichAlbumsWithStatus, nextSearchOffset } from "@/helpers/spotifySearch";

const rawAlbum = (id: string, name: string): SpotifyAlbumSearchItem => ({
  id,
  name,
  album_type: "single",
  artists: [{ id: `${id}-artist`, name: `${name} Artist` }],
  release_date: "2024-05-01",
  images: [{ url: `${id}.jpg`, height: 640, width: 640 }],
});

describe("mapSearchResults", () => {
  test("maps each search hit into a DisplayAlbum", () => {
    const result = mapSearchResults({ albums: { next: null, items: [rawAlbum("a1", "First"), rawAlbum("a2", "Second")] } });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      spotifyID: "a1",
      name: "First",
      artistName: "First Artist",
      artistSpotifyID: "a1-artist",
      releaseYear: 2024,
      imageURLs: [{ url: "a1.jpg", height: 640, width: 640 }],
      finalScore: null,
      affectsArtistScore: true,
      releaseType: "single",
    });
  });

  test("parses the release year off the release date", () => {
    const [album] = mapSearchResults({ albums: { next: null, items: [rawAlbum("a1", "First")] } });
    expect(album.releaseYear).toBe(2024);
  });

  test("returns an empty array when there are no hits", () => {
    expect(mapSearchResults({ albums: { next: null, items: [] } })).toEqual([]);
  });
});

describe("enrichAlbumsWithStatus", () => {
  const albums = mapSearchResults({ albums: { next: null, items: [rawAlbum("a1", "First"), rawAlbum("a2", "Second")] } });

  test("fills in the final score and bookmark status from the passed-in db data", () => {
    const result = enrichAlbumsWithStatus(albums, [{ spotifyID: "a1", finalScore: 82 }], ["a2"]);

    expect(result[0]).toMatchObject({ spotifyID: "a1", finalScore: 82, bookmarked: false });
    expect(result[1]).toMatchObject({ spotifyID: "a2", finalScore: null, bookmarked: true });
  });

  test("leaves the score null and bookmarked false when there is no db data", () => {
    const result = enrichAlbumsWithStatus(albums, [], []);
    expect(result[0]).toMatchObject({ finalScore: null, bookmarked: false });
    expect(result[1]).toMatchObject({ finalScore: null, bookmarked: false });
  });

  test("does not mutate the input albums", () => {
    const snapshot = JSON.parse(JSON.stringify(albums));
    enrichAlbumsWithStatus(albums, [{ spotifyID: "a1", finalScore: 82 }], ["a1"]);
    expect(albums).toEqual(snapshot);
  });
});

describe("nextSearchOffset", () => {
  const page = (next: string | null, count: number) => ({ albums: { next, items: Array.from({ length: count }, (_, index) => rawAlbum(`a${index}`, "Album")) } });

  test("moves on by one page while Spotify has more", () => {
    expect(nextSearchOffset(20, page("more", 10))).toBe(30);
  });

  test("stops when Spotify has no next page", () => {
    expect(nextSearchOffset(20, page(null, 4))).toBeNull();
  });

  test("stops on an empty page even when Spotify says there is more", () => {
    expect(nextSearchOffset(20, page("more", 0))).toBeNull();
  });

  test("stops before the page Spotify would refuse", () => {
    expect(nextSearchOffset(980, page("more", 10))).toBe(990);
    expect(nextSearchOffset(990, page("more", 10))).toBeNull();
  });
});
