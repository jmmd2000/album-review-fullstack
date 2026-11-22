import { afterAll, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { PlayModel } from "@/api/models/Play";
import { ListeningSummaryService } from "@/api/services/ListeningSummaryService";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const play = (trackID: string, playedAt: string, artistIDs: string[] = ["artist1"], durationMs = 180000): SpotifyPlay => ({
  played_at: playedAt,
  track: {
    id: trackID,
    name: trackID,
    duration_ms: durationMs,
    artists: artistIDs.map(id => ({ id, name: id })),
    album: { id: `album-${trackID}`, name: `album-${trackID}`, release_date: "2024-01-01", images: [], artists: [{ id: artistIDs[0], name: artistIDs[0] }] },
  },
});

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("splits plays by Irish-time day, and gives each day its totals and most played artist, album and track", async () => {
  await PlayModel.savePlays([
    play("song", "2026-07-01T10:00:00Z"),
    play("song", "2026-07-01T11:00:00Z"),
    play("other", "2026-07-01T12:00:00Z", ["artist2"]),
    // 00:30 on 2 July in Irish summer time
    play("late", "2026-07-01T23:30:00Z", ["artist2"], 240000),
  ]);

  const days = await ListeningSummaryService.getDays("2026-07-01", "2026-07-02");

  expect(days.map(day => [day.date, day.plays, day.minutes])).toEqual([
    ["2026-07-01", 3, 9],
    ["2026-07-02", 1, 4],
  ]);
  expect(days[0]).toMatchObject({
    topArtist: { name: "artist1", plays: 2 },
    topAlbum: { name: "album-song", artist: "artist1", plays: 2 },
    topTrack: { name: "song", artist: "artist1", plays: 2 },
    reviews: [],
    gigs: [],
  });
  expect(days[1].topTrack).toEqual({ name: "late", artist: "artist2", plays: 1 });
});

test("adds reviews and gigs on their Irish-time day, even with no plays, and leaves out empty days", async () => {
  await query(`INSERT INTO reviewed_artists (spotify_id, name, image_urls, total_score, review_count, unrated) VALUES ('band', 'The Band', '[]', 0, 1, false)`);
  await query(`INSERT INTO reviewed_albums (artist_spotify_id, artist_name, name, spotify_id, release_date, release_year, image_urls, runtime, review_score, final_score, colors, genres, created_at)
    VALUES ('band', 'The Band', 'First Album', 'first-album', '2024-01-01', 2024, '[]', '40 minutes', 80, 80, '[]', '{}', '2026-07-03T23:15:00Z')`);
  await query(`INSERT INTO concerts (artist_spotify_id, show_name, date, venue, city, image_url, setlist_link, support_artists)
    VALUES ('band', 'The Tour', '2026-07-06T19:30:00Z', 'Vicar Street', 'Dublin', '', '', '[]')`);

  const days = await ListeningSummaryService.getDays("2026-07-01", "2026-07-31");

  expect(days).toEqual([
    { date: "2026-07-04", plays: 0, minutes: 0, topArtist: null, topAlbum: null, topTrack: null, reviews: [{ album: "First Album", artist: "The Band" }], gigs: [] },
    { date: "2026-07-06", plays: 0, minutes: 0, topArtist: null, topAlbum: null, topTrack: null, reviews: [], gigs: [{ artist: "The Band", venue: "Vicar Street", city: "Dublin" }] },
  ]);
});
