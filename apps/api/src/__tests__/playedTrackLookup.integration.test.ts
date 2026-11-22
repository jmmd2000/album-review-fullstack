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

const spotifyTrack = (trackID: string): SpotifyPlayedTrack => ({
  id: trackID,
  name: `Track ${trackID}`,
  duration_ms: 200000,
  artists: [{ id: `artist-${trackID}`, name: `Artist ${trackID}` }],
  album: { id: `album-${trackID}`, name: "Album", release_date: "2024-01-01", images: [{ url: "300.jpg", width: 300, height: 300 }], artists: [{ id: `artist-${trackID}`, name: "Artist" }] },
});

const spotifyArtist = (artistID: string, images = [{ url: "photo.jpg", width: 300, height: 300 }]): SpotifyArtistResponse => ({ id: artistID, name: artistID, images });

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

test("fills in each imported track's album, artists and length, then the new artists' photos", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockResolvedValue({ found: [spotifyTrack("track1")], missingIDs: [] });
  vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([spotifyArtist("artist-track1")]);

  await PlayedTrackLookupService.lookUp(() => {});

  const track = await query("SELECT duration_ms, album_spotify_id FROM played_tracks WHERE spotify_id = 'track1'");
  expect(track.rows[0]).toEqual({ duration_ms: 200000, album_spotify_id: "album-track1" });
  const artist = await query("SELECT image_url, image_looked_up FROM played_artists WHERE spotify_id = 'artist-track1'");
  expect(artist.rows[0]).toEqual({ image_url: "photo.jpg", image_looked_up: true });
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

test("makes at most 200 requests in a run", async () => {
  const trackIDs = Array.from({ length: 201 * 50 }, (_, index) => `track${index}`);
  await importTracks(trackIDs);
  const getTracks = vi.spyOn(SpotifyClient, "getTracks").mockImplementation(async () => ({ found: [], missingIDs: [] }));
  const getSeveralArtists = vi.spyOn(SpotifyClient, "getSeveralArtists").mockResolvedValue([]);

  await PlayedTrackLookupService.lookUp(() => {});

  expect(getTracks.mock.calls.length + getSeveralArtists.mock.calls.length).toBe(200);
});

test("a Spotify failure stops the run, and the tracks left are looked up next time", async () => {
  await importTracks(["track1"]);
  vi.spyOn(SpotifyClient, "getTracks").mockRejectedValueOnce(new Error("Spotify is busy"));

  await expect(PlayedTrackLookupService.lookUp(() => {})).rejects.toThrow("Spotify is busy");

  const track = await query("SELECT unavailable, album_spotify_id FROM played_tracks WHERE spotify_id = 'track1'");
  expect(track.rows[0]).toEqual({ unavailable: false, album_spotify_id: null });
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
