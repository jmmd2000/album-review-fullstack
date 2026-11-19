import { afterAll, afterEach, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { GenreModel } from "@/api/models/Genre";
import { ListenerLinkModel } from "@/api/models/ListenerLink";

const CURRENT = "relatedCurrentAlbum001";

async function seedArtist(spotifyID: string, deezerID: number | null) {
  await ArtistModel.createArtist({ spotifyID, name: spotifyID, imageURLs: [], headerImage: null, totalScore: 70, reviewCount: 1, unrated: false, leaderboardPosition: null, deezerID });
}

async function seedAlbum(spotifyID: string, artistSpotifyID: string, releaseYear: number, finalScore: number, genreIDs: number[]) {
  await AlbumModel.createAlbum({
    spotifyID,
    name: spotifyID,
    artistSpotifyID,
    artistName: artistSpotifyID,
    releaseDate: `${releaseYear}-01-01`,
    releaseYear,
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
  await GenreModel.linkGenresToAlbum(spotifyID, genreIDs);
}

beforeEach(async () => {
  await resetTables(query);

  const pop = await GenreModel.createGenre({ name: "pop", slug: "pop" });
  const hyperpop = await GenreModel.createGenre({ name: "hyperpop", slug: "hyperpop" });

  await seedArtist("charli", 1462230);
  await seedArtist("slayyyter", 500);
  await seedArtist("ratboys", null);
  await seedArtist("wednesday", 600);
  await seedArtist("filler", null);

  await seedAlbum(CURRENT, "charli", 2026, 87, [pop.id, hyperpop.id]);
  await seedAlbum("charliOlder", "charli", 2022, 90, [pop.id]);
  await seedAlbum("slayyyterAlbum", "slayyyter", 2023, 60, []);
  await seedAlbum("ratboysAlbum", "ratboys", 2024, 50, [hyperpop.id]);
  await seedAlbum("wednesdayAlbum", "wednesday", 2025, 80, [pop.id]);
  await seedAlbum("fillerAlbum", "filler", 2021, 70, [pop.id]);

  await ListenerLinkModel.replaceLinks(
    "charli",
    [
      { linkedDeezerID: 999, linkedName: "Not reviewed" },
      { linkedDeezerID: 500, linkedName: "slayyyter" },
    ],
    new Date()
  );
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("lists the artist's other albums, then similar albums with linked artists first and a rare shared genre before a common one", async () => {
  const res = await api.get(`/api/albums/${CURRENT}/related`);
  expect(res.status).toBe(200);
  const { moreByArtist, similar } = await res.json();

  expect(moreByArtist.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["charliOlder"]);
  expect(similar.map((album: { spotifyID: string }) => album.spotifyID)).toEqual(["slayyyterAlbum", "ratboysAlbum", "wednesdayAlbum", "fillerAlbum"]);
});

test("an album that isn't reviewed gets a 404", async () => {
  const res = await api.get("/api/albums/relatedMissingAlbum001/related");
  expect(res.status).toBe(404);
});
