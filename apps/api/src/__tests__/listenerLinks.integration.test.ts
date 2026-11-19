import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { ArtistModel } from "@/api/models/Artist";
import { LastFmClient } from "@/api/models/LastFmClient";
import { ListenerLinkModel, type LinkableArtist } from "@/api/models/ListenerLink";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";

const SPOTIFY_ID = "listenerLinkArtist0001";
const wednesday: LinkableArtist = { spotifyID: SPOTIFY_ID, name: "Wednesday", imageURLs: [] };

async function seedArtist(spotifyID: string) {
  await ArtistModel.createArtist({ spotifyID, name: spotifyID, imageURLs: [], headerImage: null, totalScore: 80, reviewCount: 1, unrated: false, leaderboardPosition: null });
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

test("a refresh replaces the saved links with Last.fm's list, in order, and says whether it changed", async () => {
  await seedArtist(SPOTIFY_ID);
  vi.spyOn(LastFmClient, "getSimilarArtists").mockResolvedValue([
    { name: "MJ Lenderman", match: 1 },
    { name: "feeble little horse", match: 0.55 },
  ]);
  expect(await ListenerLinkService.refreshArtist(wednesday)).toBe("changed");
  expect(await ListenerLinkModel.getLinkedNames(SPOTIFY_ID)).toEqual(["MJ Lenderman", "feeble little horse"]);

  expect(await ListenerLinkService.refreshArtist(wednesday)).toBe("same");

  vi.spyOn(LastFmClient, "getSimilarArtists").mockResolvedValue([{ name: "Geese", match: 1 }]);
  expect(await ListenerLinkService.refreshArtist(wednesday)).toBe("changed");
  expect(await ListenerLinkModel.getLinkedNames(SPOTIFY_ID)).toEqual(["Geese"]);
});

test("the saved links stay when Last.fm fails, doesn't know the artist or has no similar artists", async () => {
  await seedArtist(SPOTIFY_ID);
  await ListenerLinkModel.replaceLinks(SPOTIFY_ID, [{ linkedName: "MJ Lenderman", match: 1 }], new Date());

  vi.spyOn(LastFmClient, "getSimilarArtists").mockRejectedValueOnce(new Error("Last.fm is down"));
  await expect(ListenerLinkService.refreshArtist(wednesday)).rejects.toThrow("Last.fm is down");
  expect(await ListenerLinkModel.getLinkedNames(SPOTIFY_ID)).toEqual(["MJ Lenderman"]);

  vi.spyOn(LastFmClient, "getSimilarArtists").mockResolvedValueOnce(null);
  expect(await ListenerLinkService.refreshArtist(wednesday)).toBe("unmatched");
  expect(await ListenerLinkModel.getLinkedNames(SPOTIFY_ID)).toEqual(["MJ Lenderman"]);

  vi.spyOn(LastFmClient, "getSimilarArtists").mockResolvedValueOnce([]);
  expect(await ListenerLinkService.refreshArtist(wednesday)).toBe("same");
  expect(await ListenerLinkModel.getLinkedNames(SPOTIFY_ID)).toEqual(["MJ Lenderman"]);
});

test("only artists with no saved links count as new", async () => {
  await seedArtist(SPOTIFY_ID);
  await seedArtist("listenerLinkArtist0002");
  await ListenerLinkModel.replaceLinks(SPOTIFY_ID, [{ linkedName: "MJ Lenderman", match: 1 }], new Date());

  const withoutLinks = await ListenerLinkModel.getArtistsWithoutLinks([SPOTIFY_ID, "listenerLinkArtist0002"]);
  expect(withoutLinks.map(artist => artist.spotifyID)).toEqual(["listenerLinkArtist0002"]);
});

test("saving links for an artist that no longer exists saves nothing", async () => {
  expect(await ListenerLinkModel.replaceLinks(SPOTIFY_ID, [{ linkedName: "MJ Lenderman", match: 1 }], new Date())).toBe(false);
});
