import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Executor } from "@/db/client";
import { playedAlbums, playedArtistGenres, playedArtists, playedTrackArtists, playedTracks, reviewedAlbums, reviewedTracks } from "@/db/schema";
import { largestImageURL } from "@/helpers/largestImageURL";
import { normaliseISRC } from "@/helpers/normaliseISRC";
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
      .values(
        albums.map(album => ({
          spotifyID: album.id,
          name: album.name,
          imageURL: mediumImageURL(album.images),
          largeImageURL: largestImageURL(album.images),
          albumType: album.album_type ?? null,
          artistSpotifyID: album.artists[0].id,
        }))
      )
      .onConflictDoUpdate({
        target: playedAlbums.spotifyID,
        set: {
          name: sql`excluded.name`,
          imageURL: sql`excluded.image_url`,
          largeImageURL: sql`excluded.large_image_url`,
          albumType: sql`excluded.album_type`,
          artistSpotifyID: sql`excluded.artist_spotify_id`,
        },
      });

    await executor
      .insert(playedTracks)
      .values(
        tracks.map(track => ({
          spotifyID: track.id,
          name: track.name,
          durationMs: track.duration_ms,
          albumSpotifyID: track.album.id,
          isrc: normaliseISRC(track.external_ids?.isrc),
          lookedUp: true,
        }))
      )
      .onConflictDoUpdate({
        target: playedTracks.spotifyID,
        set: {
          name: sql`excluded.name`,
          durationMs: sql`excluded.duration_ms`,
          albumSpotifyID: sql`excluded.album_spotify_id`,
          isrc: sql`excluded.isrc`,
          lookedUp: sql`excluded.looked_up`,
        },
      });

    await executor
      .insert(playedTrackArtists)
      .values(credits)
      .onConflictDoUpdate({ target: [playedTrackArtists.trackSpotifyID, playedTrackArtists.artistSpotifyID], set: { position: sql`excluded.position` } });
  }

  /** The tracks not looked up yet that Spotify hasn't said it no longer has, with the cover saved for them so far. */
  static async getTracksToLookUp(): Promise<{ spotifyID: string; name: string; imageURL: string | null }[]> {
    return db
      .select({ spotifyID: playedTracks.spotifyID, name: playedTracks.name, imageURL: playedAlbums.imageURL })
      .from(playedTracks)
      .leftJoin(playedAlbums, eq(playedAlbums.spotifyID, playedTracks.albumSpotifyID))
      .where(and(eq(playedTracks.lookedUp, false), eq(playedTracks.unavailable, false)))
      .orderBy(playedTracks.spotifyID);
  }

  /** The reviewed tracks whose ISRC isn't looked up yet, with their album's cover. */
  static async getReviewedTracksToLookUp(): Promise<{ spotifyID: string; name: string; imageURL: string | null }[]> {
    return db
      .select({
        spotifyID: reviewedTracks.spotifyID,
        name: reviewedTracks.name,
        imageURL: sql<string | null>`coalesce(${reviewedAlbums.imageURLs}->1->>'url', ${reviewedAlbums.imageURLs}->0->>'url')`,
      })
      .from(reviewedTracks)
      .innerJoin(reviewedAlbums, eq(reviewedAlbums.spotifyID, reviewedTracks.albumSpotifyID))
      .where(eq(reviewedTracks.isrcLookedUp, false))
      .orderBy(reviewedTracks.spotifyID);
  }

  /** Saves each looked-up reviewed track's ISRC, and marks every track in `trackIDs` as looked up. */
  static async saveReviewedISRCs(trackIDs: string[], found: SpotifyPlayedTrack[]): Promise<void> {
    await db.transaction(async tx => {
      for (const track of found) {
        await tx
          .update(reviewedTracks)
          .set({ isrc: normaliseISRC(track.external_ids?.isrc) })
          .where(eq(reviewedTracks.spotifyID, track.id));
      }
      await tx.update(reviewedTracks).set({ isrcLookedUp: true }).where(inArray(reviewedTracks.spotifyID, trackIDs));
    });
  }

  static async markUnavailable(trackIDs: string[]): Promise<void> {
    if (trackIDs.length === 0) return;
    await db.update(playedTracks).set({ unavailable: true }).where(inArray(playedTracks.spotifyID, trackIDs));
  }

  /** The artists whose photo isn't looked up yet, with the photo saved for them so far. */
  static async getArtistsToLookUp(): Promise<{ spotifyID: string; name: string; imageURL: string | null }[]> {
    return db
      .select({ spotifyID: playedArtists.spotifyID, name: playedArtists.name, imageURL: playedArtists.imageURL })
      .from(playedArtists)
      .where(eq(playedArtists.imageLookedUp, false))
      .orderBy(playedArtists.spotifyID);
  }

  static async countArtistsToLookUp(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playedArtists)
      .where(eq(playedArtists.imageLookedUp, false));
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
          .set({ imageURL: mediumImageURL(artist.images), largeImageURL: largestImageURL(artist.images) })
          .where(eq(playedArtists.spotifyID, artist.id));
      }
      await tx.update(playedArtists).set({ imageLookedUp: true }).where(inArray(playedArtists.spotifyID, artistIDs));
    });
  }

  /** The artists whose genres aren't looked up yet, with their photos. */
  static async getArtistsWithoutGenres(): Promise<{ spotifyID: string; name: string; imageURL: string | null }[]> {
    return db
      .select({ spotifyID: playedArtists.spotifyID, name: playedArtists.name, imageURL: playedArtists.imageURL })
      .from(playedArtists)
      .where(eq(playedArtists.genresLookedUp, false))
      .orderBy(playedArtists.spotifyID);
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
