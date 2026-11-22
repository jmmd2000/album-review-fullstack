import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { playedAlbums, playedArtists, playedTrackArtists, playedTracks, plays } from "@/db/schema";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { chunks } from "@/helpers/chunks";
import { uniqueBy } from "@/helpers/uniqueBy";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

// Keeps each insert well under Postgres's limit of 65,535 values in one query
const INSERT_BATCH_SIZE = 5000;

/**
 * The moment just after the whole second `time` falls in. The streaming history export gives times
 * in whole seconds, but a play saved from the recent list has milliseconds, so the same play can land just after the export's last second.
 */
function endOfSecond(time: Date): Date {
  return new Date(Math.floor(time.getTime() / 1000) * 1000 + 1000);
}

/** One play from the streaming history export */
export interface ImportedPlay {
  playedAt: Date;
  msPlayed: number;
  trackSpotifyID: string;
  trackName: string;
}

/** A play with its track and the track's artists, for the Settings list */
export interface RecentPlay {
  id: number;
  playedAt: Date;
  trackName: string;
  albumImageURL: string | null;
  /** In credit order */
  artistNames: string[];
}

export class PlayModel {
  /** Counts the saved plays from `from` to the end of the second `to` falls in. */
  static async countInRange(from: Date, to: Date): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(plays)
      .where(and(gte(plays.playedAt, from), lt(plays.playedAt, endOfSecond(to))));
    return row?.count ?? 0;
  }

  /**
   * Replaces every saved play from the first imported play to the end of the last one's second with the imported plays, in one transaction.
   * A track that is already saved keeps its details. A new track is saved with only its name.
   * A second play of the same track at the same time in the import is dropped.
   * @returns How many saved plays it removed, and how many imported plays it saved.
   */
  static async replaceRange(importedPlays: ImportedPlay[]): Promise<{ removed: number; saved: number }> {
    if (importedPlays.length === 0) return { removed: 0, saved: 0 };

    const uniquePlays = uniqueBy(importedPlays, play => `${play.trackSpotifyID}:${play.playedAt.toISOString()}`);
    const tracks = uniqueBy(
      uniquePlays.map(play => ({ spotifyID: play.trackSpotifyID, name: play.trackName })),
      track => track.spotifyID
    );
    let from = uniquePlays[0].playedAt;
    let to = uniquePlays[0].playedAt;
    for (const play of uniquePlays) {
      if (play.playedAt < from) from = play.playedAt;
      if (play.playedAt > to) to = play.playedAt;
    }

    return db.transaction(async tx => {
      const deleted = await tx.delete(plays).where(and(gte(plays.playedAt, from), lt(plays.playedAt, endOfSecond(to))));
      for (const batch of chunks(tracks, INSERT_BATCH_SIZE)) {
        await tx.insert(playedTracks).values(batch).onConflictDoNothing();
      }
      for (const batch of chunks(uniquePlays, INSERT_BATCH_SIZE)) {
        await tx.insert(plays).values(batch.map(play => ({ trackSpotifyID: play.trackSpotifyID, playedAt: play.playedAt, msPlayed: play.msPlayed })));
      }
      return { removed: deleted.rowCount ?? 0, saved: uniquePlays.length };
    });
  }

  /** The latest plays, newest first. */
  static async getRecent(limit: number): Promise<RecentPlay[]> {
    const rows = await db
      .select({ id: plays.id, playedAt: plays.playedAt, trackSpotifyID: plays.trackSpotifyID, trackName: playedTracks.name, albumImageURL: playedAlbums.imageURL })
      .from(plays)
      .innerJoin(playedTracks, eq(playedTracks.spotifyID, plays.trackSpotifyID))
      .leftJoin(playedAlbums, eq(playedAlbums.spotifyID, playedTracks.albumSpotifyID))
      .orderBy(desc(plays.playedAt))
      .limit(limit);
    if (rows.length === 0) return [];

    const credits = await db
      .select({ trackSpotifyID: playedTrackArtists.trackSpotifyID, name: playedArtists.name })
      .from(playedTrackArtists)
      .innerJoin(playedArtists, eq(playedArtists.spotifyID, playedTrackArtists.artistSpotifyID))
      .where(
        inArray(
          playedTrackArtists.trackSpotifyID,
          rows.map(row => row.trackSpotifyID)
        )
      )
      .orderBy(asc(playedTrackArtists.position));

    return rows.map(row => ({
      id: row.id,
      playedAt: row.playedAt,
      trackName: row.trackName,
      albumImageURL: row.albumImageURL,
      artistNames: credits.filter(credit => credit.trackSpotifyID === row.trackSpotifyID).map(credit => credit.name),
    }));
  }

  /**
   * Saves plays with their tracks, albums and artists, in one transaction.
   * A track, album or artist that is already saved gets its name and details updated.
   * @returns How many of the plays were new. A play of the same track at the same time is already saved.
   */
  static async savePlays(spotifyPlays: SpotifyPlay[]): Promise<number> {
    if (spotifyPlays.length === 0) return 0;

    return db.transaction(async tx => {
      await PlayedTrackModel.saveTracks(
        spotifyPlays.map(play => play.track),
        tx
      );
      const saved = await tx
        .insert(plays)
        .values(spotifyPlays.map(play => ({ trackSpotifyID: play.track.id, playedAt: new Date(play.played_at) })))
        .onConflictDoNothing()
        .returning({ id: plays.id });
      return saved.length;
    });
  }
}
