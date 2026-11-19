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
