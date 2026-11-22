import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, type Executor } from "@/db/client";
import { playedAlbums, playedArtistGenres, playedArtists, playedTrackArtists, playedTracks } from "@/db/schema";
import { mediumImageURL } from "@/helpers/mediumImageURL";
import { uniqueBy } from "@/helpers/uniqueBy";
import type { SpotifyArtistResponse, SpotifyPlayedTrack } from "@/api/schemas/spotifySchema";

/** The tracks and artists from the admin's plays, and the lookups that fill in their details. */
export class PlayedTrackModel {
  /**
   * Saves tracks with their albums, artists and credits.
   * A track, album or artist that is already saved gets its name and details updated.
   */
  static async saveTracks(spotifyTracks: SpotifyPlayedTrack[], executor: Executor = db): Promise<void> {
    if (spotifyTracks.length === 0) return;

    const tracks = uniqueBy(spotifyTracks, track => track.id);
    const albums = uniqueBy(
      tracks.map(track => track.album),
      album => album.id
    );
    const artists = uniqueBy(
      tracks.flatMap(track => track.artists),
      artist => artist.id
    );
    const credits = uniqueBy(
      tracks.flatMap(track => track.artists.map((artist, index) => ({ trackSpotifyID: track.id, artistSpotifyID: artist.id, position: index + 1 }))),
      credit => `${credit.trackSpotifyID}:${credit.artistSpotifyID}`
    );

    await executor
      .insert(playedArtists)
      .values(artists.map(artist => ({ spotifyID: artist.id, name: artist.name })))
      .onConflictDoUpdate({ target: playedArtists.spotifyID, set: { name: sql`excluded.name` } });

    await executor
      .insert(playedAlbums)
      .values(albums.map(album => ({ spotifyID: album.id, name: album.name, imageURL: mediumImageURL(album.images) })))
      .onConflictDoUpdate({ target: playedAlbums.spotifyID, set: { name: sql`excluded.name`, imageURL: sql`excluded.image_url` } });

    await executor
      .insert(playedTracks)
      .values(tracks.map(track => ({ spotifyID: track.id, name: track.name, durationMs: track.duration_ms, albumSpotifyID: track.album.id })))
      .onConflictDoUpdate({
        target: playedTracks.spotifyID,
        set: { name: sql`excluded.name`, durationMs: sql`excluded.duration_ms`, albumSpotifyID: sql`excluded.album_spotify_id` },
      });

    await executor
      .insert(playedTrackArtists)
      .values(credits)
      .onConflictDoUpdate({ target: [playedTrackArtists.trackSpotifyID, playedTrackArtists.artistSpotifyID], set: { position: sql`excluded.position` } });
  }

  /** The tracks with no album that Spotify hasn't said it no longer has. */
  static async getTracksToLookUp(limit: number): Promise<{ spotifyID: string; name: string }[]> {
    return db
      .select({ spotifyID: playedTracks.spotifyID, name: playedTracks.name })
      .from(playedTracks)
      .where(and(isNull(playedTracks.albumSpotifyID), eq(playedTracks.unavailable, false)))
      .orderBy(playedTracks.spotifyID)
      .limit(limit);
  }

  static async markUnavailable(trackIDs: string[]): Promise<void> {
    if (trackIDs.length === 0) return;
    await db.update(playedTracks).set({ unavailable: true }).where(inArray(playedTracks.spotifyID, trackIDs));
  }

  /** The artists whose photo isn't looked up yet. */
  static async getArtistsToLookUp(limit: number): Promise<{ spotifyID: string; name: string }[]> {
    return db.select({ spotifyID: playedArtists.spotifyID, name: playedArtists.name }).from(playedArtists).where(eq(playedArtists.imageLookedUp, false)).orderBy(playedArtists.spotifyID).limit(limit);
  }

  /** How many tracks and artist photos are waiting to be looked up on Spotify. */
  static async countLookupsWaiting(): Promise<number> {
    const [tracks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playedTracks)
      .where(and(isNull(playedTracks.albumSpotifyID), eq(playedTracks.unavailable, false)));
    const [artists] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playedArtists)
      .where(eq(playedArtists.imageLookedUp, false));
    return (tracks?.count ?? 0) + (artists?.count ?? 0);
  }

  /** How many artists are waiting for their genres to be looked up on Last.fm. */
  static async countGenresWaiting(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playedArtists)
      .where(eq(playedArtists.genresLookedUp, false));
    return row?.count ?? 0;
  }

  /**
   * Saves each looked-up artist's photo, and marks every artist in `artistIDs` as looked up.
   * An artist Spotify doesn't have, or one with no photo, keeps no photo.
   */
  static async savePhotos(artistIDs: string[], found: SpotifyArtistResponse[]): Promise<void> {
    await db.transaction(async tx => {
      for (const artist of found) {
        await tx
          .update(playedArtists)
          .set({ imageURL: mediumImageURL(artist.images) })
          .where(eq(playedArtists.spotifyID, artist.id));
      }
      await tx.update(playedArtists).set({ imageLookedUp: true }).where(inArray(playedArtists.spotifyID, artistIDs));
    });
  }

  /** The artists whose genres aren't looked up yet. */
  static async getArtistsWithoutGenres(limit: number): Promise<{ spotifyID: string; name: string }[]> {
    return db.select({ spotifyID: playedArtists.spotifyID, name: playedArtists.name }).from(playedArtists).where(eq(playedArtists.genresLookedUp, false)).orderBy(playedArtists.spotifyID).limit(limit);
  }

  /** Replaces an artist's genres, in the order given, and marks the artist as looked up. */
  static async saveGenres(artistSpotifyID: string, genreIDs: number[]): Promise<void> {
    await db.transaction(async tx => {
      await tx.delete(playedArtistGenres).where(eq(playedArtistGenres.artistSpotifyID, artistSpotifyID));
      if (genreIDs.length > 0) {
        await tx.insert(playedArtistGenres).values(genreIDs.map((genreID, index) => ({ artistSpotifyID, genreID, position: index + 1 })));
      }
      await tx.update(playedArtists).set({ genresLookedUp: true }).where(eq(playedArtists.spotifyID, artistSpotifyID));
    });
  }
}
