import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { playedAlbums, playedArtists, playedTrackArtists, playedTracks, plays } from "@/db/schema";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

/** Keeps one item for each key. A later item with the same key replaces an earlier one. */
function uniqueBy<Item>(items: Item[], key: (item: Item) => string): Item[] {
  const byKey = new Map<string, Item>();
  for (const item of items) byKey.set(key(item), item);
  return [...byKey.values()];
}

// Keeps each insert well under Postgres's limit of 65,535 values in one query
const INSERT_BATCH_SIZE = 5000;

/** Splits a list into lists of at most `size` items. */
function chunks<Item>(items: Item[], size: number): Item[][] {
  const result: Item[][] = [];
  for (let start = 0; start < items.length; start += size) result.push(items.slice(start, start + size));
  return result;
}

/** One play from the streaming history export */
export interface ImportedPlay {
  playedAt: Date;
  msPlayed: number;
  trackSpotifyID: string;
  trackName: string;
}

/** Picks the cover closest to 300px wide without going over, or the only cover there is. Spotify lists covers largest first. */
function mediumCoverURL(images: SpotifyPlay["track"]["album"]["images"]): string | null {
  const medium = images.find(image => image.width <= 300);
  return (medium ?? images[0])?.url ?? null;
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
  /** Counts the saved plays from `from` to `to`, both included. */
  static async countInRange(from: Date, to: Date): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(plays)
      .where(and(gte(plays.playedAt, from), lte(plays.playedAt, to)));
    return row?.count ?? 0;
  }

  /**
   * Replaces every saved play from the first to the last imported play with the imported plays, in one transaction.
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
      const deleted = await tx.delete(plays).where(and(gte(plays.playedAt, from), lte(plays.playedAt, to)));
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

    const tracks = uniqueBy(
      spotifyPlays.map(play => play.track),
      track => track.id
    );
    const albums = uniqueBy(
      tracks.map(track => track.album),
      album => album.id
    );
    const artists = uniqueBy(
      tracks.flatMap(track => track.artists),
      artist => artist.id
    );
    const trackArtists = uniqueBy(
      tracks.flatMap(track => track.artists.map((artist, index) => ({ trackSpotifyID: track.id, artistSpotifyID: artist.id, position: index + 1 }))),
      credit => `${credit.trackSpotifyID}:${credit.artistSpotifyID}`
    );

    return db.transaction(async tx => {
      await tx
        .insert(playedArtists)
        .values(artists.map(artist => ({ spotifyID: artist.id, name: artist.name })))
        .onConflictDoUpdate({ target: playedArtists.spotifyID, set: { name: sql`excluded.name` } });

      await tx
        .insert(playedAlbums)
        .values(albums.map(album => ({ spotifyID: album.id, name: album.name, imageURL: mediumCoverURL(album.images) })))
        .onConflictDoUpdate({ target: playedAlbums.spotifyID, set: { name: sql`excluded.name`, imageURL: sql`excluded.image_url` } });

      await tx
        .insert(playedTracks)
        .values(tracks.map(track => ({ spotifyID: track.id, name: track.name, durationMs: track.duration_ms, albumSpotifyID: track.album.id })))
        .onConflictDoUpdate({
          target: playedTracks.spotifyID,
          set: { name: sql`excluded.name`, durationMs: sql`excluded.duration_ms`, albumSpotifyID: sql`excluded.album_spotify_id` },
        });

      await tx
        .insert(playedTrackArtists)
        .values(trackArtists)
        .onConflictDoUpdate({ target: [playedTrackArtists.trackSpotifyID, playedTrackArtists.artistSpotifyID], set: { position: sql`excluded.position` } });

      const saved = await tx
        .insert(plays)
        .values(spotifyPlays.map(play => ({ trackSpotifyID: play.track.id, playedAt: new Date(play.played_at) })))
        .onConflictDoNothing()
        .returning({ id: plays.id });
      return saved.length;
    });
  }
}
