import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { SuggestedAlbumModel } from "@/api/models/SuggestedAlbum";
import { SuggestionService } from "@/api/services/SuggestionService";
import { LastFmClient } from "@/api/models/LastFmClient";
import { ListenerLinkModel } from "@/api/models/ListenerLink";
import type { SpotifyArtistAlbum } from "@/api/schemas/spotifySchema";

const now = new Date("2026-11-19T12:00:00Z");

async function seedArtistWithAlbum(artistSpotifyID: string, finalScore: number) {
  await ArtistModel.createArtist({ spotifyID: artistSpotifyID, name: artistSpotifyID, imageURLs: [], headerImage: null, totalScore: 0, reviewCount: 1, unrated: false, leaderboardPosition: null });
  const spotifyID = `${artistSpotifyID}Reviewed`;
  await AlbumModel.createAlbum({
    spotifyID,
    name: spotifyID,
    artistSpotifyID,
    artistName: artistSpotifyID,
    releaseDate: "2024-01-01",
    releaseYear: 2024,
    imageURLs: [],
    runtime: "40 minutes",
    reviewContent: "",
    reviewScore: finalScore,
    bonus: 0,
    finalScore,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
  await AlbumModel.upsertAlbumArtists(spotifyID, [{ artistSpotifyID, affectsScore: true }]);
}

const spotifyAlbum = (id: string, artistID: string, releaseDate: string, name = id): SpotifyArtistAlbum => ({
  id,
  name,
  release_date: releaseDate,
  release_date_precision: "day",
  images: [],
  artists: [{ id: artistID, name: artistID }],
});

const savedIDs = async () => (await SuggestedAlbumModel.getAll("new")).map(album => album.spotifyID);

beforeEach(async () => {
  await resetTables(query);
  vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("token");
  await seedArtistWithAlbum("loved", 90);
  await seedArtistWithAlbum("liked", 60);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("saves new studio albums, best artist average first, leaving out old, reissued, reviewed and bookmarked albums", async () => {
  await BookmarkedAlbumModel.bookmarkAlbum({ spotifyID: "likedBookmarked", name: "x", artistSpotifyID: "liked", artistName: "liked", releaseYear: 2026, imageURLs: [] });
  vi.spyOn(SpotifyClient, "getArtistAlbums").mockImplementation(async artistID =>
    artistID === "loved"
      ? [spotifyAlbum("lovedNew", "loved", "2026-10-01"), spotifyAlbum("lovedReviewed", "loved", "2026-10-01")]
      : [
          spotifyAlbum("likedNewer", "liked", "2026-11-10"),
          spotifyAlbum("likedOld", "liked", "2025-01-01"),
          spotifyAlbum("likedDeluxe", "liked", "2026-11-01", "Something (Deluxe)"),
          spotifyAlbum("likedBookmarked", "liked", "2026-11-01"),
        ]
  );

  await SuggestionService.refreshNewAlbums(() => {}, now);

  expect(await savedIDs()).toEqual(["lovedNew", "likedNewer"]);
});

test("an artist whose albums can't be fetched keeps their albums from the last run", async () => {
  vi.spyOn(SpotifyClient, "getArtistAlbums").mockImplementation(async artistID => [spotifyAlbum(`${artistID}New`, artistID, "2026-10-01")]);
  await SuggestionService.refreshNewAlbums(() => {}, now);
  expect(await savedIDs()).toEqual(["lovedNew", "likedNew"]);

  vi.spyOn(SpotifyClient, "getArtistAlbums").mockImplementation(async artistID => {
    if (artistID === "liked") throw new Error("Spotify is down");
    return [];
  });
  const failures: string[] = [];
  await SuggestionService.refreshNewAlbums(event => event === "failed" && failures.push(event), now);

  expect(await savedIDs()).toEqual(["likedNew"]);
  expect(failures).toHaveLength(1);
});

const searchHit = (id: string, artistName: string, albumType = "album") => ({
  albums: { items: [{ id, name: id, release_date: "2024-03-01", images: [], artists: [{ id: `${artistName}ID`, name: artistName }], album_type: albumType }], next: null },
});

async function linkLovedTo(names: string[]) {
  await ListenerLinkModel.replaceLinks(
    "loved",
    names.map((linkedName, index) => ({ linkedName, match: 1 - index / 10 })),
    new Date()
  );
}

const pickedIDs = async () => (await SuggestedAlbumModel.getAll("picked")).map(album => album.spotifyID);

test("picks each linked artist's most played studio album on Spotify, skipping live albums, wrong artists and taken albums", async () => {
  await linkLovedTo(["Horsegirl", "Bookmarked Band", "Wrong Artist Band"]);
  await BookmarkedAlbumModel.bookmarkAlbum({ spotifyID: "bookmarkedBandAlbum", name: "x", artistSpotifyID: "b", artistName: "Bookmarked Band", releaseYear: 2024, imageURLs: [] });
  vi.spyOn(LastFmClient, "getTopAlbums").mockImplementation(async artistName =>
    artistName === "Horsegirl"
      ? [
          { name: "Versions of Modern Performance (Live)", playcount: 900 },
          { name: "Phonetics On and On", playcount: 500 },
        ]
      : [{ name: "Their Album", playcount: 100 }]
  );
  vi.spyOn(SpotifyClient, "searchAlbums").mockImplementation(async query => {
    if (query.includes("Horsegirl")) return searchHit("phonetics", "Horsegirl");
    if (query.includes("Bookmarked Band")) return searchHit("bookmarkedBandAlbum", "Bookmarked Band");
    return searchHit("someoneElse", "A Different Artist");
  });

  await SuggestionService.refreshPicks();

  expect(await pickedIDs()).toEqual(["phonetics"]);
});

test("a dismissed album leaves the row at once and never comes back", async () => {
  await linkLovedTo(["Horsegirl"]);
  vi.spyOn(LastFmClient, "getTopAlbums").mockResolvedValue([{ name: "Phonetics On and On", playcount: 500 }]);
  vi.spyOn(SpotifyClient, "searchAlbums").mockResolvedValue(searchHit("phonetics", "Horsegirl"));
  await SuggestionService.refreshPicks();
  expect(await pickedIDs()).toEqual(["phonetics"]);

  await SuggestedAlbumModel.dismiss("phonetics");
  expect(await pickedIDs()).toEqual([]);

  await SuggestionService.refreshPicks();
  expect(await pickedIDs()).toEqual([]);
});

test("the picked row stays when every artist fails", async () => {
  await linkLovedTo(["Horsegirl"]);
  vi.spyOn(LastFmClient, "getTopAlbums").mockResolvedValue([{ name: "Phonetics On and On", playcount: 500 }]);
  vi.spyOn(SpotifyClient, "searchAlbums").mockResolvedValue(searchHit("phonetics", "Horsegirl"));
  await SuggestionService.refreshPicks();

  vi.spyOn(SpotifyClient, "searchAlbums").mockRejectedValue(new Error("Spotify is down"));
  await expect(SuggestionService.refreshPicks()).rejects.toThrow("Spotify is down");
  expect(await pickedIDs()).toEqual(["phonetics"]);
});
