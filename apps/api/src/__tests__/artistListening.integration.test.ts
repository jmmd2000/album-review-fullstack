import { afterAll, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { PlayModel } from "@/api/models/Play";
import { PlayedGroupModel } from "@/api/models/PlayedGroup";
import { TrackModel } from "@/api/models/Track";
import { ArtistListeningService } from "@/api/services/ArtistListeningService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const play = (trackID: string, playedAt: string, artistID: string, albumID = `${artistID}-album`, isrc?: string): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: trackID,
    duration_ms: 200000,
    artists: [{ id: artistID, name: artistID }],
    album: { id: albumID, name: "Album", album_type: "album", release_date: "2024-01-01", images: [], artists: [{ id: artistID, name: artistID }] },
    external_ids: isrc ? { isrc } : undefined,
  },
});

beforeEach(async () => {
  await resetTables(query);
  await ArtistModel.createArtist({ spotifyID: "artist", name: "artist", imageURLs: [], headerImage: null, totalScore: 70, reviewCount: 1, unrated: false, leaderboardPosition: 1 });
  await AlbumModel.createAlbum({
    spotifyID: "artist-album",
    name: "Album",
    artistSpotifyID: "artist",
    artistName: "artist",
    releaseDate: "2024-01-01",
    releaseYear: 2024,
    imageURLs: [],
    runtime: "40 minutes",
    reviewContent: "",
    reviewScore: 70,
    bonus: 0,
    finalScore: 70,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
  await AlbumModel.upsertAlbumArtists("artist-album", [{ artistSpotifyID: "artist", affectsScore: true }]);
  await TrackModel.createTrack({
    artistSpotifyID: "artist",
    artistName: "artist",
    albumSpotifyID: "artist-album",
    name: "song",
    spotifyID: "song",
    features: [],
    duration: 200000,
    rating: 8,
    isrc: "QZAAA2600001",
    isrcLookedUp: true,
  });
  await query(`INSERT INTO track_artists (track_spotify_id, artist_spotify_id) VALUES ('song', 'artist')`);
  await query(
    `INSERT INTO concerts (artist_spotify_id, show_name, date, venue, city, image_url, setlist_link, support_artists) VALUES ('artist', 'The Tour', '2026-02-10T20:00:00Z', 'Vicar Street', 'Dublin', '', '', '[]')`
  );
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("gives the artist's plays, first play, and plays and rank each month, with empty months filled in", async () => {
  await PlayModel.savePlays([
    play("song", "2025-12-05T10:00:00Z", "artist", "artist-album", "QZAAA2600001"),
    play("other", "2025-12-05T11:00:00Z", "rival"),
    play("other", "2025-12-06T11:00:00Z", "rival"),
    play("song", "2026-02-05T10:00:00Z", "artist", "artist-album", "QZAAA2600001"),
  ]);

  const listening = await ArtistListeningService.getArtistListening("artist", new Date("2026-03-15T12:00:00Z"));

  expect(listening.plays).toBe(2);
  // The total is rounded once, so it isn't the sum of the rounded months
  expect(listening.minutes).toBe(7);
  expect(listening.firstPlayedAt?.toISOString()).toBe("2025-12-05T10:00:00.000Z");
  expect(listening.months).toEqual([
    { month: "2025-12", plays: 1, minutes: 3, rank: 2 },
    { month: "2026-01", plays: 0, minutes: 0, rank: null },
    { month: "2026-02", plays: 1, minutes: 3, rank: 1 },
    { month: "2026-03", plays: 0, minutes: 0, rank: null },
  ]);
});

test("gives the gig dates, and each track's and album's plays with their copies", async () => {
  await PlayModel.savePlays([
    play("song", "2026-01-05T10:00:00Z", "artist", "artist-album", "QZAAA2600001"),
    // Another copy of the reviewed song, such as on a deluxe edition
    play("song-copy", "2026-01-06T10:00:00Z", "artist", "artist-deluxe", "QZAAA2600001"),
  ]);
  await PlayedGroupModel.groupAll();

  const listening = await ArtistListeningService.getArtistListening("artist", new Date("2026-03-15T12:00:00Z"));

  expect(listening.gigDates).toEqual([new Date("2026-02-10T20:00:00Z")]);
  expect(listening.trackPlays).toEqual({ song: 2 });
  expect(listening.albumPlays).toEqual({ "artist-album": 2 });
});

test("an artist never played gives no months", async () => {
  const listening = await ArtistListeningService.getArtistListening("artist");

  expect(listening.plays).toBe(0);
  expect(listening.months).toEqual([]);
});

test("the artist listening route is for the admin only", async () => {
  const path = "/api/listening/artist/3VBNIRx1LxVdRqOiPgkLwv";
  expect((await api.get(path)).status).toBe(401);
  expect((await api.get(path, adminCookie())).status).toBe(200);
});
