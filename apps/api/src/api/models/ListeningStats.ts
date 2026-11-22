import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import { db } from "@/db/client";

export type TopKind = "artists" | "tracks" | "albums" | "genres";
export type PeriodName = "4-weeks" | "6-months" | "year" | "all" | "custom";
export type TimelineUnit = "day" | "week" | "month";
/** One artist, track, album or genre, to narrow the charts to its plays */
export interface EntryFilter {
  kind: TopKind;
  id: string;
}

/** What the top lists rank by: the number of plays, or the time listened */
export type RankBy = "plays" | "minutes";

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
  /** The largest cover or photo, or null for a genre */
  largeImageURL: string | null;
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
const DETAIL_LIMIT = 5;
// Copies of one recording or album count as one, under the copy their group shows as. A copy not grouped yet counts as itself.
const TRACK_GROUP = sql`coalesce(t.main_spotify_id, t.spotify_id)`;
const ALBUM_GROUP = sql`coalesce(al.main_spotify_id, al.spotify_id)`;

/** Where a listening entry links */
export type EntryLink = { type: "artist" | "album" | "review"; id: string } | { type: "search"; query: string };

/** Picks the plays of one artist, track, album or genre. Plays join played tracks as `t`. */
function entryCondition(kind: TopKind, id: string): SQL {
  if (kind === "tracks") return sql`${TRACK_GROUP} = ${id}`;
  if (kind === "albums") return sql`EXISTS (SELECT 1 FROM played_albums al WHERE al.spotify_id = t.album_spotify_id AND ${ALBUM_GROUP} = ${id})`;
  if (kind === "artists") return sql`EXISTS (SELECT 1 FROM played_track_artists ta WHERE ta.track_spotify_id = p.track_spotify_id AND ta.artist_spotify_id = ${id})`;
  return sql`EXISTS (
    SELECT 1 FROM played_track_artists ta JOIN played_artist_genres pag ON pag.artist_spotify_id = ta.artist_spotify_id
    WHERE ta.track_spotify_id = p.track_spotify_id AND pag.genre_id::text = ${id})`;
}

/** The condition that narrows plays to one entry, or nothing when there's no entry. Plays join played tracks as `t`. */
function entryFilter(entry: EntryFilter | undefined): SQL {
  if (!entry) return sql``;
  return sql`AND ${entryCondition(entry.kind, entry.id)}`;
}

/** Played time in whole minutes, as an SQL value over a group of plays that join played tracks as `t` */
const MINUTES = sql`round(sum(${PLAY_MS}) / 60000.0)::int`;

/** Orders a group of plays by plays or by minutes, with the other as the tie-break */
const orderBy = (by: RankBy) => (by === "plays" ? sql`plays DESC, minutes DESC` : sql`minutes DESC, plays DESC`);

function inPeriod(period: Period): SQL {
  if (period.from === null) return sql`p.played_at < ${period.to}`;
  return sql`p.played_at >= ${period.from} AND p.played_at < ${period.to}`;
}

/**
 * Every artist, track, album or genre played in the period with its plays and milliseconds, ranked by plays then listening time,
 * or by listening time then plays, then by name. A play with two artists counts once for each artist,
 * and a play counts once for each of its artists' genres.
 */
function rankedQuery(kind: TopKind, period: Period, by: RankBy): SQL {
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
      SELECT main.spotify_id AS id, main.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_tracks main ON main.spotify_id = ${TRACK_GROUP}
      WHERE ${where}
      GROUP BY main.spotify_id, main.name`,
    albums: sql`
      SELECT main.spotify_id AS id, main.name, count(*)::int AS plays, sum(${PLAY_MS})::bigint AS ms
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      JOIN played_albums main ON main.spotify_id = ${ALBUM_GROUP}
      WHERE ${where}
      GROUP BY main.spotify_id, main.name`,
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

  const order = by === "plays" ? sql`grouped.plays DESC, grouped.ms DESC` : sql`grouped.ms DESC, grouped.plays DESC`;
  return sql`
    SELECT (row_number() OVER (ORDER BY ${order}, grouped.name ASC))::int AS rank, grouped.*
    FROM (${grouped}) grouped`;
}

type EntryDetails = Pick<TopEntry, "artistNames" | "albumCount" | "imageURLs" | "largeImageURL" | "score">;

// A reviewed album's or artist's images are listed largest first
const REVIEWED_LARGE_IMAGE = (column: SQL) => sql`${column}->0->>'url'`;
const REVIEWED_MEDIUM_IMAGE = (column: SQL) => sql`coalesce(${column}->1->>'url', ${column}->0->>'url')`;

/** The details each kind shows beside its name, for the given IDs */
async function detailsFor(kind: TopKind, ids: string[], period: Period): Promise<Map<string, EntryDetails>> {
  const details = new Map<string, EntryDetails>();
  if (ids.length === 0) return details;

  const queries = {
    artists: sql`
      SELECT a.spotify_id AS id,
        coalesce(a.image_url, ${REVIEWED_MEDIUM_IMAGE(sql`ra.image_urls`)}) AS image_url,
        coalesce(${REVIEWED_LARGE_IMAGE(sql`ra.image_urls`)}, a.large_image_url, a.image_url) AS large_image_url,
        CASE WHEN ra.review_count > 0 AND NOT ra.unrated THEN ra.total_score END AS score,
        '{}'::text[] AS artist_names
      FROM played_artists a
      LEFT JOIN reviewed_artists ra ON ra.spotify_id = a.spotify_id
      WHERE a.spotify_id IN (${sql.join(ids, sql`, `)})`,
    tracks: sql`
      SELECT t.spotify_id AS id, al.image_url, coalesce(al.large_image_url, al.image_url) AS large_image_url, rt.rating AS score,
        array(SELECT a.name FROM played_track_artists ta JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id WHERE ta.track_spotify_id = t.spotify_id ORDER BY ta.position) AS artist_names
      FROM played_tracks t
      LEFT JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      LEFT JOIN reviewed_tracks rt ON rt.spotify_id = coalesce(t.reviewed_spotify_id, t.spotify_id)
      WHERE t.spotify_id IN (${sql.join(ids, sql`, `)})`,
    albums: sql`
      SELECT al.spotify_id AS id, al.image_url,
        coalesce(${REVIEWED_LARGE_IMAGE(sql`ra.image_urls`)}, al.large_image_url, al.image_url) AS large_image_url,
        ra.final_score AS score,
        array(
          SELECT a.name FROM played_tracks t
          JOIN played_albums copy ON copy.spotify_id = t.album_spotify_id
          JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id AND ta.position = 1
          JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
          WHERE coalesce(copy.main_spotify_id, copy.spotify_id) = al.spotify_id
          GROUP BY a.name ORDER BY count(*) DESC, a.name LIMIT 1
        ) AS artist_names
      FROM played_albums al
      LEFT JOIN reviewed_albums ra ON ra.spotify_id = coalesce(al.reviewed_spotify_id, al.spotify_id)
      WHERE al.spotify_id IN (${sql.join(ids, sql`, `)})`,
    genres: sql`
      SELECT g.id::text AS id, NULL AS image_url, NULL AS large_image_url, NULL::real AS score, '{}'::text[] AS artist_names
      FROM genres g
      WHERE g.id::text IN (${sql.join(ids, sql`, `)})`,
  };

  const [result, albumCounts] = await Promise.all([db.execute(queries[kind]), kind === "artists" ? countAlbumsPlayed(ids, period) : new Map<string, number>()]);
  for (const row of result.rows as unknown as { id: string; image_url: string | null; large_image_url: string | null; score: number | null; artist_names: string[] }[]) {
    details.set(row.id, {
      artistNames: row.artist_names,
      albumCount: kind === "artists" ? (albumCounts.get(row.id) ?? 0) : null,
      imageURLs: row.image_url ? [row.image_url] : [],
      largeImageURL: row.large_image_url,
      score: row.score,
    });
  }
  return details;
}

/**
 * How many of each artist's albums were played in the period. An album counts when the artist is its first artist.
 * Copies, deluxe editions and singles of one album count once, and singles, EPs and compilations on their own don't count.
 */
async function countAlbumsPlayed(artistIDs: string[], period: Period): Promise<Map<string, number>> {
  const result = await db.execute(sql`
    SELECT main.artist_spotify_id AS id, count(DISTINCT main.spotify_id)::int AS albums
    FROM plays p
    JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
    JOIN played_albums al ON al.spotify_id = t.album_spotify_id
    JOIN played_albums main ON main.spotify_id = ${ALBUM_GROUP}
    WHERE main.album_type = 'album' AND main.artist_spotify_id IN (${sql.join(artistIDs, sql`, `)}) AND ${inPeriod(period)} AND ${STREAM_CONDITION}
    GROUP BY main.artist_spotify_id`);
  return new Map((result.rows as unknown as { id: string; albums: number }[]).map(row => [row.id, row.albums]));
}

/**
 * All-time plays of a reviewed album, as an SQL value for sorting. Its other copies, deluxe editions, clean versions
 * and singles count too, the same as in the listening stats.
 */
export function albumPlaysSQL(albumSpotifyID: SQL | AnyColumn): SQL {
  return sql`(
    SELECT count(*) FROM plays p
    JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
    JOIN played_albums al ON al.spotify_id = t.album_spotify_id
    WHERE ${REVIEWED_ALBUM_MATCH(albumSpotifyID)} AND ${STREAM_CONDITION})`;
}

/** All-time plays credited to a reviewed artist, as an SQL value for sorting */
export function artistPlaysSQL(artistSpotifyID: SQL | AnyColumn): SQL {
  return sql`(SELECT count(*) FROM plays p JOIN played_track_artists ta ON ta.track_spotify_id = p.track_spotify_id WHERE ta.artist_spotify_id = ${artistSpotifyID} AND ${STREAM_CONDITION})`;
}

/** Plays of a reviewed album, as an SQL condition on played albums `al`: the album itself and its merged copies */
const REVIEWED_ALBUM_MATCH = (albumID: SQL | AnyColumn | string) => sql`(al.reviewed_spotify_id = ${albumID} OR al.spotify_id = ${albumID})`;

/** Plays of reviewed tracks, as an SQL condition on played tracks `t`: the track itself and its merged copies */
const REVIEWED_TRACK_MATCH = (trackID: SQL | AnyColumn) => sql`(t.reviewed_spotify_id = ${trackID} OR t.spotify_id = ${trackID})`;

/** One of an entry's top tracks, or one of a genre's top artists */
export interface TopListItem {
  id: string;
  name: string;
  imageURL: string | null;
  plays: number;
  minutes: number;
}

function toTopListItems(rows: unknown[]): TopListItem[] {
  return (rows as { id: string; name: string; image_url: string | null; plays: number; minutes: number }[]).map(row => ({
    id: row.id,
    name: row.name,
    imageURL: row.image_url,
    plays: row.plays,
    minutes: row.minutes,
  }));
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

  /** The 50 most played artists, tracks, albums or genres in the period with their details, or every one when `all` is true. */
  static async getTop(kind: TopKind, period: Period, by: RankBy = "plays", all = false): Promise<TopEntry[]> {
    const limit = all ? sql`` : sql`LIMIT ${TOP_LIMIT}`;
    const result = await db.execute(sql`SELECT * FROM (${rankedQuery(kind, period, by)}) ranked ORDER BY rank ${limit}`);
    const rows = result.rows as unknown as RankedRow[];
    const ids = rows.map(row => row.id);
    const details = await detailsFor(kind, ids, period);
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
        largeImageURL: detail?.largeImageURL ?? null,
        score: detail?.score ?? null,
      };
    });
  }

  /** Where each of the given IDs ranked in the period. An ID that wasn't played is left out. */
  static async getRanks(kind: TopKind, period: Period, ids: string[], by: RankBy = "plays"): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const result = await db.execute(sql`SELECT id, rank FROM (${rankedQuery(kind, period, by)}) ranked WHERE id IN (${sql.join(ids, sql`, `)})`);
    return new Map((result.rows as unknown as { id: string; rank: number }[]).map(row => [row.id, row.rank]));
  }

  /** How many plays counted in the period, how many minutes they came to, and how many artists they were by. */
  static async getTotals(period: Period): Promise<{ plays: number; minutes: number; artists: number }> {
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id WHERE ${inPeriod(period)} AND ${STREAM_CONDITION}) AS plays,
        (SELECT coalesce(sum(${PLAY_MS}), 0)::bigint FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id WHERE ${inPeriod(period)} AND ${STREAM_CONDITION}) AS ms,
        (SELECT count(DISTINCT ta.artist_spotify_id)::int FROM plays p JOIN played_track_artists ta ON ta.track_spotify_id = p.track_spotify_id WHERE ${inPeriod(period)} AND ${STREAM_CONDITION}) AS artists`);
    const row = result.rows[0] as { plays: number; ms: string | number; artists: number };
    return { plays: row.plays, minutes: Math.round(Number(row.ms) / 60000), artists: row.artists };
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

  /** How many plays of the entry counted in the period. */
  static async countEntryPlays(kind: TopKind, id: string, period: Period): Promise<number> {
    const result = await db.execute(sql`
      SELECT count(*)::int AS plays FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      WHERE ${entryCondition(kind, id)} AND ${inPeriod(period)} AND ${STREAM_CONDITION}`);
    return (result.rows[0] as { plays: number }).plays;
  }

  /** When the entry was first played, at any time, or null when it never was. */
  static async getFirstPlay(kind: TopKind, id: string): Promise<Date | null> {
    const result = await db.execute(sql`
      SELECT min(p.played_at) AS first FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      WHERE ${entryCondition(kind, id)} AND ${STREAM_CONDITION}`);
    const row = result.rows[0] as { first: Date | string | null };
    return row.first === null ? null : new Date(row.first);
  }

  /** An artist's or album's most played tracks in the period, by plays or by minutes, with their covers. */
  static async getTopTracks(kind: "artists" | "albums", id: string, period: Period, by: RankBy = "plays"): Promise<TopListItem[]> {
    const result = await db.execute(sql`
      SELECT main.spotify_id AS id, main.name, main_album.image_url, count(*)::int AS plays, ${MINUTES} AS minutes
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_tracks main ON main.spotify_id = ${TRACK_GROUP}
      LEFT JOIN played_albums main_album ON main_album.spotify_id = main.album_spotify_id
      WHERE ${entryCondition(kind, id)} AND ${inPeriod(period)} AND ${STREAM_CONDITION}
      GROUP BY main.spotify_id, main.name, main_album.image_url
      ORDER BY ${orderBy(by)}, main.name
      LIMIT ${DETAIL_LIMIT}`);
    return toTopListItems(result.rows);
  }

  /** A genre's most played artists in the period, by plays or by minutes, with their photos. */
  static async getGenreArtists(genreID: string, period: Period, by: RankBy = "plays"): Promise<TopListItem[]> {
    const result = await db.execute(sql`
      SELECT a.spotify_id AS id, a.name, a.image_url, count(*)::int AS plays, ${MINUTES} AS minutes
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_track_artists ta ON ta.track_spotify_id = t.spotify_id
      JOIN played_artists a ON a.spotify_id = ta.artist_spotify_id
      JOIN played_artist_genres pag ON pag.artist_spotify_id = a.spotify_id AND pag.genre_id::text = ${genreID}
      WHERE ${inPeriod(period)} AND ${STREAM_CONDITION}
      GROUP BY a.spotify_id, a.name, a.image_url
      ORDER BY ${orderBy(by)}, a.name
      LIMIT ${DETAIL_LIMIT}`);
    return toTopListItems(result.rows);
  }

  /** Where the entry links: the reviewed artist or album, the album to review, or a search for the artist. A track links to its album. */
  static async getLink(kind: TopKind, id: string): Promise<EntryLink | null> {
    if (kind === "genres") return null;

    if (kind === "artists") {
      const result = await db.execute(sql`
        SELECT a.name, (ra.spotify_id IS NOT NULL) AS reviewed FROM played_artists a LEFT JOIN reviewed_artists ra ON ra.spotify_id = a.spotify_id WHERE a.spotify_id = ${id}`);
      const row = result.rows[0] as { name: string; reviewed: boolean } | undefined;
      if (!row) return null;
      return row.reviewed ? { type: "artist", id } : { type: "search", query: row.name };
    }

    const albumID = kind === "albums" ? id : await this.getTrackAlbumID(id);
    if (!albumID) return null;
    const result = await db.execute(sql`
      SELECT coalesce(al.main_spotify_id, al.spotify_id) AS main_id,
        (SELECT ra.spotify_id FROM reviewed_albums ra WHERE ra.spotify_id IN (al.spotify_id, coalesce(al.reviewed_spotify_id, al.spotify_id))
          ORDER BY ra.spotify_id = al.spotify_id DESC LIMIT 1) AS reviewed_id
      FROM played_albums al WHERE al.spotify_id = ${albumID}`);
    const row = result.rows[0] as { main_id: string; reviewed_id: string | null } | undefined;
    if (!row) return { type: "review", id: albumID };
    return row.reviewed_id ? { type: "album", id: row.reviewed_id } : { type: "review", id: row.main_id };
  }

  /** The album a track's group shows on, as the album group's main album. */
  static async getTrackAlbumGroupID(trackID: string): Promise<string | null> {
    const result = await db.execute(sql`
      SELECT coalesce(al.main_spotify_id, al.spotify_id) AS album_id
      FROM played_tracks t JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      WHERE t.spotify_id = ${trackID}`);
    const row = result.rows[0] as { album_id: string } | undefined;
    return row?.album_id ?? null;
  }

  private static async getTrackAlbumID(trackID: string): Promise<string | null> {
    const result = await db.execute(sql`SELECT album_spotify_id FROM played_tracks WHERE spotify_id = ${trackID}`);
    const row = result.rows[0] as { album_spotify_id: string | null } | undefined;
    return row?.album_spotify_id ?? null;
  }

  /**
   * Plays and minutes in each day, week or month of the period, in Europe/Dublin time, with empty buckets filled in. An entry narrows them to its plays.
   * All time starts at the first play. A week starts on a Monday.
   * @returns Each bucket's first day as YYYY-MM-DD, oldest first.
   */
  static async getTimeline(period: Period, unit: TimelineUnit, entry?: EntryFilter): Promise<{ start: string; plays: number; minutes: number }[]> {
    const firstPlay = period.from ?? (entry ? await this.getFirstPlay(entry.kind, entry.id) : await this.getFirstPlayAt());
    if (!firstPlay) return [];

    const step = { day: sql`interval '1 day'`, week: sql`interval '1 week'`, month: sql`interval '1 month'` }[unit];
    const unitName = sql.raw(`'${unit}'`);
    const result = await db.execute(sql`
      WITH buckets AS (
        SELECT generate_series(
          date_trunc(${unitName}, ${firstPlay}::timestamptz AT TIME ZONE 'Europe/Dublin'),
          date_trunc(${unitName}, (${period.to}::timestamptz - interval '1 millisecond') AT TIME ZONE 'Europe/Dublin'),
          ${step}
        ) AS start
      ),
      counted AS (
        SELECT date_trunc(${unitName}, p.played_at AT TIME ZONE 'Europe/Dublin') AS start, count(*)::int AS plays, ${MINUTES} AS minutes
        FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
        WHERE p.played_at >= ${firstPlay}::timestamptz AND p.played_at < ${period.to}::timestamptz AND ${STREAM_CONDITION} ${entryFilter(entry)}
        GROUP BY 1
      )
      SELECT to_char(buckets.start, 'YYYY-MM-DD') AS start, coalesce(counted.plays, 0)::int AS plays, coalesce(counted.minutes, 0)::int AS minutes
      FROM buckets LEFT JOIN counted ON counted.start = buckets.start
      ORDER BY buckets.start`);
    return result.rows as unknown as { start: string; plays: number; minutes: number }[];
  }

  /**
   * Plays and minutes in each hour of each weekday in the period, in Europe/Dublin time, narrowed to an entry's plays if given.
   * Each grid's rows run Monday to Sunday, and its columns from midnight.
   */
  static async getClock(period: Period, entry?: EntryFilter): Promise<{ plays: number[][]; minutes: number[][] }> {
    const result = await db.execute(sql`
      SELECT extract(isodow FROM p.played_at AT TIME ZONE 'Europe/Dublin')::int AS weekday,
        extract(hour FROM p.played_at AT TIME ZONE 'Europe/Dublin')::int AS hour,
        count(*)::int AS plays, ${MINUTES} AS minutes
      FROM plays p JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      WHERE ${inPeriod(period)} AND ${STREAM_CONDITION} ${entryFilter(entry)}
      GROUP BY 1, 2`);
    const emptyGrid = () => Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    const clock = { plays: emptyGrid(), minutes: emptyGrid() };
    for (const row of result.rows as unknown as { weekday: number; hour: number; plays: number; minutes: number }[]) {
      clock.plays[row.weekday - 1][row.hour] = row.plays;
      clock.minutes[row.weekday - 1][row.hour] = row.minutes;
    }
    return clock;
  }

  /** When the first play of anything was. */
  static async getFirstPlayAt(): Promise<Date | null> {
    const result = await db.execute(sql`SELECT min(played_at) AS first FROM plays`);
    const row = result.rows[0] as { first: Date | string | null };
    return row.first === null ? null : new Date(row.first);
  }

  /**
   * The artist's plays in each month they were played, in Europe/Dublin time, with their rank among every artist played that month.
   * Artists with the same plays share a rank. Months without plays are left out.
   * @returns Each month as YYYY-MM, oldest first.
   */
  static async getArtistMonths(artistID: string): Promise<{ month: string; plays: number; rank: number }[]> {
    const result = await db.execute(sql`
      WITH monthly AS (
        SELECT date_trunc('month', p.played_at AT TIME ZONE 'Europe/Dublin') AS month, ta.artist_spotify_id, count(*)::int AS plays
        FROM plays p
        JOIN played_track_artists ta ON ta.track_spotify_id = p.track_spotify_id
        WHERE ${STREAM_CONDITION}
        GROUP BY 1, 2
      ),
      ranked AS (
        SELECT month, artist_spotify_id, plays, rank() OVER (PARTITION BY month ORDER BY plays DESC)::int AS rank FROM monthly
      )
      SELECT to_char(month, 'YYYY-MM') AS month, plays, rank FROM ranked WHERE artist_spotify_id = ${artistID} ORDER BY month`);
    return result.rows as unknown as { month: string; plays: number; rank: number }[];
  }

  /** A reviewed album's plays in each month it was played, counting its merged copies, oldest first */
  static async getAlbumMonths(albumID: string): Promise<{ month: string; plays: number }[]> {
    const result = await db.execute(sql`
      SELECT to_char(date_trunc('month', p.played_at AT TIME ZONE 'Europe/Dublin'), 'YYYY-MM') AS month, count(*)::int AS plays
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      WHERE ${REVIEWED_ALBUM_MATCH(albumID)} AND ${STREAM_CONDITION}
      GROUP BY 1
      ORDER BY 1`);
    return result.rows as unknown as { month: string; plays: number }[];
  }

  /** When a reviewed album or one of its merged copies was first played, or null when it never was */
  static async getAlbumFirstPlay(albumID: string): Promise<Date | null> {
    const result = await db.execute(sql`
      SELECT min(p.played_at) AS first
      FROM plays p
      JOIN played_tracks t ON t.spotify_id = p.track_spotify_id
      JOIN played_albums al ON al.spotify_id = t.album_spotify_id
      WHERE ${REVIEWED_ALBUM_MATCH(albumID)} AND ${STREAM_CONDITION}`);
    const row = result.rows[0] as { first: Date | string | null };
    return row.first === null ? null : new Date(row.first);
  }

  /** All-time plays of each of the given reviewed tracks, counting their merged copies. A track with no plays is left out. */
  static async getTrackPlays(trackIDs: string[]): Promise<Map<string, number>> {
    if (trackIDs.length === 0) return new Map();
    const result = await db.execute(sql`
      SELECT rt.spotify_id AS id, count(*)::int AS plays
      FROM reviewed_tracks rt
      JOIN played_tracks t ON ${REVIEWED_TRACK_MATCH(sql`rt.spotify_id`)}
      JOIN plays p ON p.track_spotify_id = t.spotify_id
      WHERE rt.spotify_id IN (${sql.join(trackIDs, sql`, `)}) AND ${STREAM_CONDITION}
      GROUP BY rt.spotify_id`);
    return new Map((result.rows as unknown as { id: string; plays: number }[]).map(row => [row.id, row.plays]));
  }

  /** All-time plays of each of the given reviewed albums, counting their merged copies. */
  static async getAlbumPlays(albumIDs: string[]): Promise<Map<string, number>> {
    if (albumIDs.length === 0) return new Map();
    const result = await db.execute(sql`
      SELECT ra.spotify_id AS id, ${albumPlaysSQL(sql`ra.spotify_id`)}::int AS plays
      FROM reviewed_albums ra
      WHERE ra.spotify_id IN (${sql.join(albumIDs, sql`, `)})`);
    return new Map((result.rows as unknown as { id: string; plays: number }[]).map(row => [row.id, row.plays]));
  }
}
