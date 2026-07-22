import { describe, test, expect } from "vitest";
import type { SpotifyAlbum } from "@shared/types";
import { mapSearchResults, enrichAlbumsWithStatus } from "@/helpers/spotifySearch";

// A raw Spotify album carrying only the fields the mapper actually reads.
const rawAlbum = (id: string, name: string): SpotifyAlbum =>
  ({
    id,
    name,
    artists: [{ id: `${id}-artist`, name: `${name} Artist` }],
    release_date: "2024-05-01",
    images: [{ url: `${id}.jpg`, height: 640, width: 640 }],
  }) as unknown as SpotifyAlbum;

describe("mapSearchResults", () => {
  test("maps each search hit into a DisplayAlbum", () => {
    const result = mapSearchResults({ albums: { items: [rawAlbum("a1", "First"), rawAlbum("a2", "Second")] } });

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
    });
  });

  test("parses the release year off the release date", () => {
    const [album] = mapSearchResults({ albums: { items: [rawAlbum("a1", "First")] } });
    expect(album.releaseYear).toBe(2024);
  });

  test("returns an empty array when there are no hits", () => {
    expect(mapSearchResults({ albums: { items: [] } })).toEqual([]);
  });
});

describe("enrichAlbumsWithStatus", () => {
  const albums = mapSearchResults({ albums: { items: [rawAlbum("a1", "First"), rawAlbum("a2", "Second")] } });

  test("fills in review score and bookmark status from the passed-in db data", () => {
    const result = enrichAlbumsWithStatus(albums, [{ spotifyID: "a1", reviewScore: 82 }], ["a2"]);

    expect(result[0]).toMatchObject({ spotifyID: "a1", reviewScore: 82, bookmarked: false });
    expect(result[1]).toMatchObject({ spotifyID: "a2", reviewScore: undefined, bookmarked: true });
  });

  test("leaves score undefined and bookmarked false when there is no db data", () => {
    const result = enrichAlbumsWithStatus(albums, [], []);
    expect(result[0]).toMatchObject({ reviewScore: undefined, bookmarked: false });
    expect(result[1]).toMatchObject({ reviewScore: undefined, bookmarked: false });
  });

  test("does not mutate the input albums", () => {
    const snapshot = JSON.parse(JSON.stringify(albums));
    enrichAlbumsWithStatus(albums, [{ spotifyID: "a1", reviewScore: 82 }], ["a1"]);
    expect(albums).toEqual(snapshot);
  });
});
