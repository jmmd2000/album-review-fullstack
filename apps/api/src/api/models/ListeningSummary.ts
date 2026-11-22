import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { ALBUM_GROUP, PLAY_MS, STREAM_CONDITION, TRACK_GROUP, type Period } from "@/api/models/ListeningStats";

/** The Irish-time date of a play, as YYYY-MM-DD. Plays join as `p`. */
const PLAY_DAY = sql`(p.played_at AT TIME ZONE 'Europe/Dublin')::date::text`;

const inPeriod = (period: Period) => sql`p.played_at >= ${period.from} AND p.played_at < ${period.to} AND ${STREAM_CONDITION}`;

/** A day's plays and minutes */
export interface DayTotals {
  date: string;
  plays: number;
  minutes: number;
}

/** A day's most played artist, track or album. `artist` is null for an artist. */
export interface DayTop {
  date: string;
  name: string;
  artist: string | null;
  plays: number;
}

/** An album reviewed on a day */
export interface DayReview {
  date: string;
  album: string;
  artist: string;
}

/** A gig on a day */
export interface DayGig {
  date: string;
  artist: string;
  venue: string;
  city: string;
}

/**
 * The top entry of each day, from rows grouped by day and entry. Ranks by plays, then listening time, then name,
 * like the listening stats.
 */
async function topPerDay(grouped: SQL): Promise<DayTop[]> {
  const result = await db.execute(sql`
    SELECT date, name, artist, plays FROM (
      SELECT grouped.*, row_number() OVER (PARTITION BY date ORDER BY plays DESC, ms DESC, name) AS place
      FROM (${grouped}) grouped
    ) ranked
    WHERE place = 1
    ORDER BY date`);
  return result.rows as unknown as DayTop[];
}

export class ListeningSummaryModel {
  /** Each day's plays and minutes in the period, for days with plays. Minutes are whole minutes. */
  static async getTotals(period: Period): Promise<DayTotals[]> {
    const result = await db.execute(sql`
      SELECT ${PLAY_DAY} AS date, count(*)::int AS plays, round(sum(${PLAY_MS}) / 60000.0)::int AS minutes
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      WHERE ${inPeriod(period)}
      GROUP BY 1
      ORDER BY 1`);
    return result.rows as unknown as DayTotals[];
  }

  /** Each day's most played artist. A play with two artists counts once for each. */
  static async getTopArtists(period: Period): Promise<DayTop[]> {
    return topPerDay(sql`
      SELECT ${PLAY_DAY} AS date, a.name, NULL::text AS artist, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
      JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
      WHERE ${inPeriod(period)}
      GROUP BY 1, a.spotify_id, a.name`);
  }

  /** Each day's most played track, with its first artist. Copies of one recording count as one. */
  static async getTopTracks(period: Period): Promise<DayTop[]> {
    return topPerDay(sql`
      SELECT ${PLAY_DAY} AS date, main.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms,
        (SELECT a.name FROM played_track_artists ta JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
          WHERE ta.track_spotify_id = main.spotify_id ORDER BY ta.position LIMIT 1) AS artist
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_tracks main ON main.spotify_id = ${TRACK_GROUP}
      WHERE ${inPeriod(period)}
      GROUP BY 1, main.spotify_id, main.name`);
  }

  /** Each day's most played album, with its first artist. An album's copies count as one. */
  static async getTopAlbums(period: Period): Promise<DayTop[]> {
    return topPerDay(sql`
      SELECT ${PLAY_DAY} AS date, main.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms,
        (SELECT a.name FROM played_artists a WHERE a.spotify_id = main.artist_spotify_id) AS artist
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      JOIN played_albums main ON main.spotify_id = ${ALBUM_GROUP}
      WHERE ${inPeriod(period)}
      GROUP BY 1, main.spotify_id, main.name, main.artist_spotify_id`);
  }

  /** The albums reviewed in the period, on the Irish-time day each was written. */
  static async getReviews(period: Period): Promise<DayReview[]> {
    const result = await db.execute(sql`
      SELECT (created_at AT TIME ZONE 'Europe/Dublin')::date::text AS date, name AS album, artist_name AS artist
      FROM reviewed_albums
      WHERE created_at >= ${period.from} AND created_at < ${period.to}
      ORDER BY created_at`);
    return result.rows as unknown as DayReview[];
  }

  /** The gigs in the period, on their Irish-time date. */
  static async getGigs(period: Period): Promise<DayGig[]> {
    const result = await db.execute(sql`
      SELECT (c.date AT TIME ZONE 'Europe/Dublin')::date::text AS date, ra.name AS artist, c.venue, c.city
      FROM concerts c
      JOIN reviewed_artists ra ON ra.spotify_id = c.artist_spotify_id
      WHERE c.date >= ${period.from} AND c.date < ${period.to}
      ORDER BY c.date`);
    return result.rows as unknown as DayGig[];
  }
}
