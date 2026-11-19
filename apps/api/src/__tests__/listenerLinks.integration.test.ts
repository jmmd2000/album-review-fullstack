import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { ArtistModel } from "@/api/models/Artist";
import { DeezerClient } from "@/api/models/DeezerClient";
import { ListenerLinkModel } from "@/api/models/ListenerLink";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";

const SPOTIFY_ID = "listenerLinkArtist0001";

async function seedArtist(deezerID: number | null) {
  await ArtistModel.createArtist({ spotifyID: SPOTIFY_ID, name: "Wednesday", imageURLs: [], headerImage: null, totalScore: 80, reviewCount: 1, unrated: false, leaderboardPosition: null, deezerID });
}

async function getArtist() {
  const [artist] = await ListenerLinkModel.getArtistsBySpotifyIDs([SPOTIFY_ID]);
  return artist;
}

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("a refresh replaces the saved links with Deezer's list, in order, and says whether it changed", async () => {
  await seedArtist(87096062);
  vi.spyOn(DeezerClient, "getRelatedArtists").mockResolvedValue([
    { id: 1, name: "MJ Lenderman" },
    { id: 2, name: "Horsegirl" },
  ]);
  expect(await ListenerLinkService.refreshArtist(await getArtist())).toBe("changed");
  expect(await ListenerLinkModel.getLinkedDeezerIDs(SPOTIFY_ID)).toEqual([1, 2]);

  expect(await ListenerLinkService.refreshArtist(await getArtist())).toBe("same");

  vi.spyOn(DeezerClient, "getRelatedArtists").mockResolvedValue([{ id: 3, name: "Geese" }]);
  expect(await ListenerLinkService.refreshArtist(await getArtist())).toBe("changed");
  expect(await ListenerLinkModel.getLinkedDeezerIDs(SPOTIFY_ID)).toEqual([3]);
});

test("the saved links stay when Deezer fails or has no related artists", async () => {
  await seedArtist(87096062);
  await ListenerLinkModel.replaceLinks(SPOTIFY_ID, [{ linkedDeezerID: 1, linkedName: "MJ Lenderman" }], new Date());

  vi.spyOn(DeezerClient, "getRelatedArtists").mockRejectedValueOnce(new Error("Deezer is down"));
  await expect(ListenerLinkService.refreshArtist(await getArtist())).rejects.toThrow("Deezer is down");
  expect(await ListenerLinkModel.getLinkedDeezerIDs(SPOTIFY_ID)).toEqual([1]);

  vi.spyOn(DeezerClient, "getRelatedArtists").mockResolvedValueOnce([]);
  expect(await ListenerLinkService.refreshArtist(await getArtist())).toBe("same");
  expect(await ListenerLinkModel.getLinkedDeezerIDs(SPOTIFY_ID)).toEqual([1]);
});

test("a new match is saved on the artist, and an artist with no match is left without one", async () => {
  await seedArtist(null);
  vi.spyOn(ListenerLinkModel, "getAlbumNames").mockResolvedValue(["Bleeds"]);
  const search = vi.spyOn(DeezerClient, "searchAlbums").mockResolvedValue([{ title: "Bleeds", artist: { id: 87096062, name: "Wednesday" } }]);
  vi.spyOn(DeezerClient, "getRelatedArtists").mockResolvedValue([{ id: 1, name: "MJ Lenderman" }]);

  await ListenerLinkService.refreshArtist(await getArtist());
  expect((await getArtist()).deezerID).toBe(87096062);

  await ListenerLinkService.refreshArtist(await getArtist());
  expect(search).toHaveBeenCalledTimes(1);

  await query("UPDATE reviewed_artists SET deezer_id = NULL");
  search.mockResolvedValue([{ title: "Wednesday (Soundtrack)", artist: { id: 5, name: "Wednesday Addams" } }]);
  expect(await ListenerLinkService.refreshArtist(await getArtist())).toBe("unmatched");
  expect((await getArtist()).deezerID).toBeNull();
});

test("saving links for an artist that no longer exists saves nothing", async () => {
  expect(await ListenerLinkModel.replaceLinks(SPOTIFY_ID, [{ linkedDeezerID: 1, linkedName: "MJ Lenderman" }], new Date())).toBe(false);
});
