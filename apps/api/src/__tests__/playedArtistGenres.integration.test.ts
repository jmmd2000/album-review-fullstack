import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { GenreModel } from "@/api/models/Genre";
import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { PlayedArtistGenreService } from "@/api/services/PlayedArtistGenreService";
import type { SpotifyPlayedTrack } from "@/api/schemas/spotifySchema";

const trackBy = (artistID: string): SpotifyPlayedTrack => ({
  id: `track-${artistID}`,
  name: "Track",
  duration_ms: 200000,
  artists: [{ id: artistID, name: `Artist ${artistID}` }],
  album: { id: `album-${artistID}`, name: "Album", release_date: "2024-01-01", images: [], artists: [{ id: artistID, name: "Artist" }] },
});

async function genresOf(artistID: string): Promise<string[]> {
  const result = await query("SELECT g.name FROM played_artist_genres pag JOIN genres g ON g.id = pag.genre_id WHERE pag.artist_spotify_id = $1 ORDER BY pag.position", [artistID]);
  return result.rows.map(row => row.name);
}

beforeEach(async () => {
  await resetTables(query);
  for (const name of ["Rock", "Britpop", "Alt-Rock", "Indie", "Pop", "Shoegaze"]) {
    await GenreModel.createGenre({ name, slug: name.toLowerCase() });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("matches the tags listeners use often to the genre list, and ignores rare and unmatched tags", async () => {
  await PlayedTrackModel.saveTracks([trackBy("coldplay")]);
  vi.spyOn(LastFmClient, "getTopTags").mockResolvedValue([
    { name: "rock", count: 100 },
    { name: "seen live", count: 95 },
    { name: "alternative rock", count: 56 },
    { name: "pop", count: 4 },
  ]);

  await PlayedArtistGenreService.lookUpGenres(() => {});

  expect(await genresOf("coldplay")).toEqual(["Rock", "Alt-Rock"]);
});

test("keeps at most 3 genres, most used first", async () => {
  await PlayedTrackModel.saveTracks([trackBy("coldplay")]);
  vi.spyOn(LastFmClient, "getTopTags").mockResolvedValue([
    { name: "rock", count: 100 },
    { name: "britpop", count: 60 },
    { name: "alternative rock", count: 56 },
    { name: "indie", count: 30 },
  ]);

  await PlayedArtistGenreService.lookUpGenres(() => {});

  expect(await genresOf("coldplay")).toEqual(["Rock", "Britpop", "Alt-Rock"]);
});

test("an artist with no matching tags gets no genre and isn't looked up again", async () => {
  await PlayedTrackModel.saveTracks([trackBy("unknown")]);
  const getTopTags = vi.spyOn(LastFmClient, "getTopTags").mockResolvedValue(null);

  await PlayedArtistGenreService.lookUpGenres(() => {});
  await PlayedArtistGenreService.lookUpGenres(() => {});

  expect(await genresOf("unknown")).toEqual([]);
  expect(getTopTags).toHaveBeenCalledTimes(1);
});

test("a new artist is picked up on the next run", async () => {
  await PlayedTrackModel.saveTracks([trackBy("first")]);
  const getTopTags = vi.spyOn(LastFmClient, "getTopTags").mockResolvedValue([{ name: "shoegaze", count: 100 }]);
  await PlayedArtistGenreService.lookUpGenres(() => {});

  await PlayedTrackModel.saveTracks([trackBy("second")]);
  await PlayedArtistGenreService.lookUpGenres(() => {});

  expect(getTopTags.mock.calls.map(call => call[0])).toEqual(["Artist first", "Artist second"]);
  expect(await genresOf("second")).toEqual(["Shoegaze"]);
});

test("an artist that fails is tried again, and Last.fm's rate limit stops the run", async () => {
  await PlayedTrackModel.saveTracks([trackBy("a"), trackBy("b")]);
  const getTopTags = vi.spyOn(LastFmClient, "getTopTags").mockRejectedValueOnce(new Error("Last.fm fell over")).mockRejectedValueOnce(new LastFmLimitError("Too many"));

  await expect(PlayedArtistGenreService.lookUpGenres(() => {})).rejects.toBeInstanceOf(LastFmLimitError);

  getTopTags.mockResolvedValue([{ name: "pop", count: 100 }]);
  await PlayedArtistGenreService.lookUpGenres(() => {});
  expect(await genresOf("a")).toEqual(["Pop"]);
  expect(await genresOf("b")).toEqual(["Pop"]);
});
