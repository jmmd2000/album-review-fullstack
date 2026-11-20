import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { playedAlbums, playedArtists, playedTrackArtists, playedTracks, plays } from "@/db/schema";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

/** Keeps one item for each key. A later item with the same key replaces an earlier one. */
function uniqueBy<Item>(items: Item[], key: (item: Item) => string): Item[] {
  const byKey = new Map<string, Item>();
  for (const item of items) byKey.set(key(item), item);
  return [...byKey.values()];
}

export class PlayModel {
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
        .values(albums.map(album => ({ spotifyID: album.id, name: album.name, imageURL: album.images[0]?.url ?? null })))
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
