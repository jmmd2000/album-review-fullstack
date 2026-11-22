import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { PlayModel } from "@/api/models/Play";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { PlayedTrackLookupService } from "@/api/services/PlayedTrackLookupService";
import type { Progress } from "@shared/types";
import type { SpotifyArtistResponse, SpotifyPlayedTrack } from "@/api/schemas/spotifySchema";

vi.mock("@/helpers/sleep", () => ({ sleep: vi.fn(() => Promise.resolve()) }));

/** A valid 12-character ISRC made from the track ID */
const isrcFor = (trackID: string) => `QZ${trackID.toUpperCase()}0000000000`.slice(0, 12);

const spotifyTrack = (trackID: string): SpotifyPlayedTrack => ({
  id: trackID,
  name: `Track ${trackID}`,
  duration_ms: 200000,
  artists: [{ id: `artist-${trackID}`, name: `Artist ${trackID}` }],
  album: {
    id: `album-${trackID}`,
    name: "Album",
    album_type: "album",
    release_date: "2024-01-01",
    images: [
      { url: "640.jpg", width: 640, height: 640 },
      { url: "300.jpg", width: 300, height: 300 },
    ],
    artists: [{ id: `artist-${trackID}`, name: "Artist" }],
  },
  external_ids: { isrc: isrcFor(trackID) },
});

const spotifyArtist = (
  artistID: string,
  images = [
    { url: "photo.jpg", width: 300, height: 300 },
    { url: "small.jpg", width: 64, height: 64 },
  ]
): SpotifyArtistResponse => ({ id: artistID, name: artistID, images });

async function importTracks(trackIDs: string[]) {
  await PlayModel.replaceRange(trackIDs.map((trackID, index) => ({ playedAt: new Date(Date.UTC(2020, 0, 1, 0, index)), msPlayed: 60000, trackSpotifyID: trackID, trackName: trackID })));
}

beforeEach(async () => {
  await resetTables(query);
  vi.spyOn(SpotifyTokenCache, "getAccessToken").mockResolvedValue("app-token");
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("fills in each imported track's album, artists, length and ISRC, then the new artists' photos", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockResolvedValue({ found: [spotifyTrack("track1")], missingIDs: [] });
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([spotifyArtist("artist-track1")]);

  await PlayedTrackLookupService.lookUp(() => {});

  const track = await query("SELECT duration_ms, album_spotify_id, isrc, looked_up FROM played_tracks WHERE spotify_id = 'track1'");
  expect(track.rows[0]).toEqual({ duration_ms: 200000, album_spotify_id: "album-track1", isrc: "QZTRACK10000", looked_up: true });
  const album = await query("SELECT image_url, large_image_url, album_type, artist_spotify_id FROM played_albums WHERE spotify_id = 'album-track1'");
  expect(album.rows[0]).toEqual({ image_url: "300.jpg", large_image_url: "640.jpg", album_type: "album", artist_spotify_id: "artist-track1" });
  const artist = await query("SELECT image_url, large_image_url, image_looked_up FROM played_artists WHERE spotify_id = 'artist-track1'");
  expect(artist.rows[0]).toEqual({ image_url: "photo.jpg", large_image_url: "photo.jpg", image_looked_up: true });
});

test("marks a track Spotify doesn't have, and doesn't look it up again", async () => {
  await importTracks(["gone"]);
  const getTracks = vi.spyOn(SpotifyClient, "getTracks").mockResolvedValue({ found: [], missingIDs: ["gone"] });
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);

  await PlayedTrackLookupService.lookUp(() => {});
  await PlayedTrackLookupService.lookUp(() => {});

  expect(getTracks).toHaveBeenCalledTimes(1);
});

test("an artist with no photo is looked up once", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockResolvedValue({ found: [spotifyTrack("track1")], missingIDs: [] });
  const getSeveralArtists = vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([spotifyArtist("artist-track1", [])]);

  await PlayedTrackLookupService.lookUp(() => {});
  await PlayedTrackLookupService.lookUp(() => {});

  expect(getSeveralArtists).toHaveBeenCalledTimes(1);
});

test("looks up every waiting track in one run, with no cap", async () => {
  await importTracks(Array.from({ length: 201 * 50 }, (_, index) => `track${index}`));
  const getTracks = vi.spyOn(SpotifyClient, "getTracks").mockImplementation(async ids => ({ found: [], missingIDs: ids }));
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);

  await PlayedTrackLookupService.lookUp(() => {});

  expect(getTracks).toHaveBeenCalledTimes(201);
});

test("looks up each reviewed track's ISRC once, and groups the copies at the end of the run", async () => {
  await query(`INSERT INTO reviewed_artists (spotify_id, name, image_urls, total_score, review_count, unrated) VALUES ('artist', 'artist', '[]', 0, 1, false)`);
  await query(`INSERT INTO reviewed_albums (artist_spotify_id, artist_name, name, spotify_id, release_date, release_year, image_urls, runtime, review_score, final_score, colors, genres)
    VALUES ('artist', 'artist', 'Album', 'album-reviewed', '2024-01-01', 2024, '[]', '40 minutes', 80, 80, '[]', '{}')`);
  await query(`INSERT INTO reviewed_tracks (artist_spotify_id, artist_name, album_spotify_id, name, spotify_id, features, duration_ms, rating)
    VALUES ('artist', 'artist', 'album-reviewed', 'Song', 'reviewed', '[]', 200000, 9)`);
  await importTracks(["copy"]);
  const getTracks = vi.spyOn(SpotifyClient, "getTracks").mockImplementation(async ids => ({
    found: ids.map(id => ({ ...spotifyTrack(id), external_ids: { isrc: "QZSAME000000" } })),
    missingIDs: [],
  }));
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);

  await PlayedTrackLookupService.lookUp(() => {});
  await PlayedTrackLookupService.lookUp(() => {});

  expect(getTracks.mock.calls.map(([ids]) => ids)).toEqual([["copy"], ["reviewed"]]);
  const reviewed = await query("SELECT isrc FROM reviewed_tracks WHERE spotify_id = 'reviewed'");
  expect(reviewed.rows[0].isrc).toBe("QZSAME000000");
  const copy = await query("SELECT reviewed_spotify_id FROM played_tracks WHERE spotify_id = 'copy'");
  expect(copy.rows[0].reviewed_spotify_id).toBe("reviewed");
});

test("after each batch, a progress event shows the last track looked up with its cover", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockResolvedValue({ found: [spotifyTrack("track1")], missingIDs: [] });
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);
  const progress: Progress[] = [];

  await PlayedTrackLookupService.lookUp((event, data) => {
    if (event === "progress") progress.push(data as Progress);
  });

  expect(progress[1]).toMatchObject({ index: 1, artistName: "Track track1 by Artist track1", artistImage: "300.jpg" });
});

test("a Spotify failure stops the run, and the tracks left are looked up next time", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockRejectedValueOnce(new Error("Spotify is busy"));

  await expect(PlayedTrackLookupService.lookUp(() => {})).rejects.toThrow("Spotify is busy");

  const track = await query("SELECT unavailable, looked_up FROM played_tracks WHERE spotify_id = 'track1'");
  expect(track.rows[0]).toEqual({ unavailable: false, looked_up: false });
});

test("sends a progress event with the first track's name before each batch's request", async () => {
  await importTracks(Array.from({ length: 60 }, (_, index) => `track${String(index).padStart(2, "0")}`));
  const events: string[] = [];
  vi.spyOn(SpotifyClient, "getTracks").mockImplementation(async ids => {
    events.push(`request ${ids.length}`);
    return { found: [], missingIDs: [] };
  });
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);

  await PlayedTrackLookupService.lookUp((event, data) => {
    if (event !== "progress") return;
    const progress = data as Progress;
    events.push(`progress ${progress.index} of ${progress.total}: ${progress.artistName}`);
  });

  expect(events).toEqual(["progress 1 of 60: track00", "request 50", "progress 51 of 60: track50", "request 10"]);
});
