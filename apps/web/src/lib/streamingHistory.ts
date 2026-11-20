import { z } from "zod";

/** The fields the import reads from a row of Spotify's extended streaming history export */
const exportRowSchema = z.object({
  ts: z.iso.datetime(),
  ms_played: z.number().int().min(0),
  master_metadata_track_name: z.string().max(255).nullish(),
  spotify_track_uri: z.string().nullish(),
});

const TRACK_URI_PREFIX = "spotify:track:";
const STREAM_MS = 30_000;

/** One play, as the import route takes it */
export interface ImportPlay {
  playedAt: string;
  msPlayed: number;
  trackSpotifyID: string;
  trackName: string;
}

export interface StreamingHistory {
  plays: ImportPlay[];
  /** Rows with no track, such as podcasts and audiobooks, and rows the import can't read */
  skippedCount: number;
}

export interface StreamingHistorySummary {
  from: string;
  to: string;
  playCount: number;
  /** Plays that lasted 30 seconds or more */
  streamCount: number;
}

/**
 * Turns the rows of one or more export files into plays. Skips rows with no track and rows it can't read,
 * and keeps one play when the same track at the same time appears twice.
 * @throws Error when a file isn't a list of rows.
 */
export function readStreamingHistory(files: { name: string; rows: unknown }[]): StreamingHistory {
  const playsByKey = new Map<string, ImportPlay>();
  let skippedCount = 0;

  for (const file of files) {
    if (!Array.isArray(file.rows)) throw new Error(`${file.name} isn't a Spotify streaming history file.`);

    for (const row of file.rows) {
      const parsed = exportRowSchema.safeParse(row);
      const uri = parsed.success ? parsed.data.spotify_track_uri : null;
      const trackName = parsed.success ? parsed.data.master_metadata_track_name : null;
      if (!parsed.success || !uri?.startsWith(TRACK_URI_PREFIX) || !trackName) {
        skippedCount++;
        continue;
      }

      const play: ImportPlay = {
        playedAt: new Date(parsed.data.ts).toISOString(),
        msPlayed: parsed.data.ms_played,
        trackSpotifyID: uri.slice(TRACK_URI_PREFIX.length),
        trackName,
      };
      playsByKey.set(`${play.trackSpotifyID}:${play.playedAt}`, play);
    }
  }

  return { plays: [...playsByKey.values()], skippedCount };
}

/** The date range and counts the dry run shows. Gives null when there are no plays. */
export function summariseStreamingHistory(plays: ImportPlay[]): StreamingHistorySummary | null {
  if (plays.length === 0) return null;

  let from = plays[0].playedAt;
  let to = plays[0].playedAt;
  let streamCount = 0;
  for (const play of plays) {
    if (play.playedAt < from) from = play.playedAt;
    if (play.playedAt > to) to = play.playedAt;
    if (play.msPlayed >= STREAM_MS) streamCount++;
  }
  return { from, to, playCount: plays.length, streamCount };
}
