import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";

export type TopKind = "artists" | "tracks" | "albums" | "genres";
export type PeriodName = "4-weeks" | "6-months" | "year" | "all" | "custom";

/** A stretch of time. `from` is null for all time. `to` is not included. */
export interface Period {
  from: Date | null;
  to: Date;
}

/** One ranked artist, track, album or genre */
export interface TopEntry {
  rank: number;
  id: string;
  name: string;
  plays: number;
  minutes: number;
  /** The track or album's artists, or the genre's most played artists */
  artistNames: string[];
  /** How many albums of the artist's were played */
  albumCount: number | null;
  /** A cover or photo. A genre gives its most played artists' photos, up to 4. */
  imageURLs: string[];
  /** The review score of a reviewed artist or album, or the rating of a reviewed track */
  score: number | null;
}

interface RankedRow {
  rank: number;
  id: string;
  name: string;
  plays: number;
  ms: string;
}

// A play counts when its length isn't known, as with plays from the recent list, or when it lasted 30 seconds or more
const STREAM_CONDITION = sql`(p.ms_played IS NULL OR p.ms_played >= 30000)`;
const PLAY_MS = sql`coalesce(p.ms_played, t.duration_ms, 0)`;
const TOP_LIMIT = 50;

function inPeriod(period: Period): SQL {
  if (period.from === null) return sql`p.played_at < ${period.to}`;
  return sql`p.played_at >= ${period.from} AND p.played_at < ${period.to}`;
}

/**
 * Every artist, track, album or genre played in the period with its plays and milliseconds, ranked by plays,
 * then by listening time, then by name. A play with two artists counts once for each artist,
 * and a play counts once for each of its artists' genres.
 */
function rankedQuery(kind: TopKind, period: Period): SQL {
  const where = sql`${inPeriod(period)} AND ${STREAM_CONDITION}`;
  const grouped = {
    artists: sql`
      SELECT a.spotify_id AS id, a.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
      JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
      WHERE ${where}
      GROUP BY a.spotify_id, a.name`,
    tracks: sql`
      SELECT t.spotify_id AS id, t.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      WHERE ${where}
      GROUP BY t.spotify_id, t.name`,
    albums: sql`
      SELECT al.spotify_id AS id, al.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      WHERE ${where}
      GROUP BY al.spotify_id, al.name`,
    genres: sql`
      SELECT g.id::text AS id, g.name, count(*)::int AS plays, sum(genre_plays.ms)::bigint AS ms
      FROM (
        SELECT DISTINCT p.id AS play_id, pag.genre_id, ${PLAY_MS} AS ms
        FROM plays p
        JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
        JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
        JOIN played_artist_genres pag ON pag.artist_spotify_id = ta.artist_spotify_id
        WHERE ${where}
      ) genre_plays
      JOIN genres g ON g.id = genre_plays.genre_id
      GROUP BY g.id, g.name`,
  }[kind];

  return sql`
    SELECT (row_number() OVER (ORDER BY grouped.plays DESC, grouped.ms DESC, grouped.name ASC))::int AS rank, grouped.*
    FROM (${grouped}) grouped`;
}

/** The details each kind shows beside its name, for the given IDs */
async function detailsFor(kind: TopKind, ids: string[]): Promise<Map<string, Pick<TopEntry, "artistNames" | "albumCount" | "imageURLs" | "score">>> {
  const details = new Map<string, Pick<TopEntry, "artistNames" | "albumCount" | "imageURLs" | "score">>();
  if (ids.length === 0) return details;

  const queries = {
    artists: sql`
      SELECT a.spotify_id AS id,
        coalesce(a.image_url, ra.image_urls->0->>'url') AS image_url,
        CASE WHEN ra.review_count > 0 AND NOT ra.unrated THEN ra.total_score END AS score,
        (SELECT count(DISTINCT t.album_spotify_id)::int FROM played_track_artists ta JOIN played_tracks t ON t.spotify_id = ta.track_spotify_id WHERE ta.artist_spotify_id = a.spotify_id) AS album_count,
        '{}'::text[] AS artist_names
      FROM played_artists a
      LEFT JOIN reviewed_artists ra ON ra.spotify_id = a.spotify_id
      WHERE a.spotify_id IN (${sql.join(ids, sql`, `)})`,
    tracks: sql`
      SELECT t.spotify_id AS id, al.image_url, rt.rating AS score, NULL::int AS album_count,
        array(SELECT a.name FROM played_track_artists ta JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id WHERE ta.track_spotify_id = t.spotify_id ORDER BY ta.position) AS artist_names
      FROM played_tracks t
      LEFT JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      LEFT JOIN reviewed_tracks rt ON rt.spotify_id = t.spotify_id
      WHERE t.spotify_id IN (${sql.join(ids, sql`, `)})`,
    albums: sql`
      SELECT al.spotify_id AS id, al.image_url, ra.final_score AS score, NULL::int AS album_count,
        array(
          SELECT a.name FROM played_tracks t
          JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id AND ta.position = 1
          JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
          WHERE t.album_spotify_id = al.spotify_id
          GROUP BY a.name ORDER BY count(*) DESC, a.name LIMIT 1
        ) AS artist_names
      FROM played_albums al
      LEFT JOIN reviewed_albums ra ON ra.spotify_id = al.spotify_id
      WHERE al.spotify_id IN (${sql.join(ids, sql`, `)})`,
    genres: sql`
      SELECT g.id::text AS id, NULL AS image_url, NULL::real AS score, NULL::int AS album_count, '{}'::text[] AS artist_names
      FROM genres g
      WHERE g.id::text IN (${sql.join(ids, sql`, `)})`,
  };

  const result = await db.execute(queries[kind]);
  for (const row of result.rows as unknown as { id: string; image_url: string | null; score: number | null; album_count: number | null; artist_names: string[] }[]) {
    details.set(row.id, { artistNames: row.artist_names, albumCount: row.album_count, imageURLs: row.image_url ? [row.image_url] : [], score: row.score });
  }
  return details;
}

export class ListeningStatsModel {
  /**
   * Works out a period's start and end. Days run from midnight to midnight in Europe/Dublin time.
   * The presets end now and include today. A custom period runs from the start of `customFrom` to the end of `customTo`.
   */
  static async resolvePeriod(name: PeriodName, now: Date, customFrom?: string, customTo?: string): Promise<Period> {
    if (name === "all") return { from: null, to: now };

    const today = sql`(${now}::timestamptz AT TIME ZONE 'Europe/Dublin')::date`;
    const bounds = {
      "4-weeks": sql`SELECT ((${today} - 27)::timestamp AT TIME ZONE 'Europe/Dublin') AS from, ${now}::timestamptz AS to`,
      "6-months": sql`SELECT (((${today} - interval '6 months')::date + 1)::timestamp AT TIME ZONE 'Europe/Dublin') AS from, ${now}::timestamptz AS to`,
      year: sql`SELECT (((${today} - interval '1 year')::date + 1)::timestamp AT TIME ZONE 'Europe/Dublin') AS from, ${now}::timestamptz AS to`,
      custom: sql`SELECT (${customFrom ?? ""}::date::timestamp AT TIME ZONE 'Europe/Dublin') AS from, ((${customTo ?? ""}::date + 1)::timestamp AT TIME ZONE 'Europe/Dublin') AS to`,
    }[name];

    const result = await db.execute(bounds);
    const row = result.rows[0] as { from: Date; to: Date };
    return { from: new Date(row.from), to: new Date(row.to) };
  }

  /** The period of the same length just before this one, or null for all time. */
  static previousPeriod(period: Period): Period | null {
    if (period.from === null) return null;
    const length = period.to.getTime() - period.from.getTime();
    return { from: new Date(period.from.getTime() - length), to: period.from };
  }

  /** The 50 most played artists, tracks, albums or genres in the period, with their details. */
  static async getTop(kind: TopKind, period: Period): Promise<TopEntry[]> {
    const result = await db.execute(sql`SELECT * FROM (${rankedQuery(kind, period)}) ranked ORDER BY rank LIMIT ${TOP_LIMIT}`);
    const rows = result.rows as unknown as RankedRow[];
    const ids = rows.map(row => row.id);
    const details = await detailsFor(kind, ids);
    const genreImages = kind === "genres" ? await this.getGenreImages(ids, period) : new Map<string, { names: string[]; imageURLs: string[] }>();

    return rows.map(row => {
      const detail = details.get(row.id);
      const genre = genreImages.get(row.id);
      return {
        rank: row.rank,
        id: row.id,
        name: row.name,
        plays: row.plays,
        minutes: Math.round(Number(row.ms) / 60000),
        artistNames: genre?.names ?? detail?.artistNames ?? [],
        albumCount: detail?.albumCount ?? null,
        imageURLs: genre?.imageURLs ?? detail?.imageURLs ?? [],
        score: detail?.score ?? null,
      };
    });
  }

  /** Where each of the given IDs ranked in the period. An ID that wasn't played is left out. */
  static async getRanks(kind: TopKind, period: Period, ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const result = await db.execute(sql`SELECT id, rank FROM (${rankedQuery(kind, period)}) ranked WHERE id IN (${sql.join(ids, sql`, `)})`);
    return new Map((result.rows as unknown as { id: string; rank: number }[]).map(row => [row.id, row.rank]));
  }

  /** How many plays counted in the period, and how many artists they were by. */
  static async getTotals(period: Period): Promise<{ plays: number; artists: number }> {
    const result = await db.execute(sql`
      SELECT count(DISTINCT p.id)::int AS plays, count(DISTINCT ta.artist_spotify_id)::int AS artists
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      LEFT JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
      WHERE ${inPeriod(period)} AND ${STREAM_CONDITION}`);
    const row = result.rows[0] as { plays: number; artists: number };
    return { plays: row.plays, artists: row.artists };
  }

  /** Each genre's 4 most played artists in the period, with their photos, most played first */
  private static async getGenreImages(genreIDs: string[], period: Period): Promise<Map<string, { names: string[]; imageURLs: string[] }>> {
    const images = new Map<string, { names: string[]; imageURLs: string[] }>();
    if (genreIDs.length === 0) return images;

    const result = await db.execute(sql`
      SELECT genre_id, name, image_url FROM (
        SELECT pag.genre_id::text AS genre_id, a.name, a.image_url,
          row_number() OVER (PARTITION BY pag.genre_id ORDER BY count(*) DESC, a.name) AS place
        FROM plays p
        JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
        JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
        JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
        JOIN played_artist_genres pag ON pag.artist_spotify_id = a.spotify_id
        WHERE ${inPeriod(period)} AND ${STREAM_CONDITION} AND pag.genre_id::text IN (${sql.join(genreIDs, sql`, `)})
        GROUP BY pag.genre_id, a.spotify_id, a.name, a.image_url
      ) ranked
      WHERE place <= 4
      ORDER BY genre_id, place`);

    for (const row of result.rows as unknown as { genre_id: string; name: string; image_url: string | null }[]) {
      const entry = images.get(row.genre_id) ?? { names: [], imageURLs: [] };
      entry.names.push(row.name);
      if (row.image_url) entry.imageURLs.push(row.image_url);
      images.set(row.genre_id, entry);
    }
    return images;
  }
}
