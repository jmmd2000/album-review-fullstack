import type { ExtractedColor, AlbumArtist } from "@shared/types";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { ArtistModel } from "@/api/models/Artist";
import { fetchArtistHeaderFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { ArtistScoreService } from "./ArtistScoreService";
import { formatDate } from "@shared/helpers/formatDate";
import getTotalDuration from "@shared/helpers/formatDuration";
import { getImageColors } from "@/helpers/getImageColors";
import { BookmarkedAlbumModel } from "../models/BookmarkedAlbum";
import { GenreModel } from "@/api/models/Genre";
import { GenreService } from "@/api/services/GenreService";
import { AppError } from "@/api/AppError";
import { db, type Executor } from "@/db/client";
import type { ReceivedReviewData, ReceivedSpotifyAlbum, ReceivedReviewedAlbum } from "@/api/schemas/reviewSchema";

function isSpotifyAlbum(album: ReceivedReviewData["album"]): album is ReceivedSpotifyAlbum {
  return !!album && "uri" in album && "tracks" in album;
}

/** Creates, edits and deletes reviews, with their tracks, genres and artist links, and keeps the artists' scores up to date. */
export class ReviewService {
  static async createAlbumReview(data: ReceivedReviewData) {
    if (!isSpotifyAlbum(data.album)) throw new AppError("Invalid album data: Expected a SpotifyAlbum, received something else", 400);

    const spotifyAlbum = data.album;
    if (await AlbumModel.findBySpotifyID(spotifyAlbum.id)) {
      throw new AppError("You have already reviewed this album.", 400);
    }

    // calculate album score
    const { baseScore, finalScore } = calculateAlbumScore(data.ratedTracks, data.bonus);

    const albumArtists = await ReviewService.resolveAlbumArtists(spotifyAlbum);
    if (albumArtists.length === 0) throw new AppError("Album artists could not be resolved", 400);

    const selectedArtistIDs = ReviewService.resolveSelectedArtistIDs(data.selectedArtistIDs, albumArtists);
    // Allow per-artist scoring for collabs, but keep the solo toggle behavior
    const scoreArtistIDs = ReviewService.resolveScoreArtistIDs(data.scoreArtistIDs, selectedArtistIDs, albumArtists.length === 1 ? data.affectsArtistScore : undefined);
    const primaryArtist = albumArtists.find(a => selectedArtistIDs.includes(a.spotifyID)) ?? albumArtists[0];

    // Ensure all selected artists exist before linking tracks/albums
    await ReviewService.ensureArtists(selectedArtistIDs, albumArtists, scoreArtistIDs, finalScore);

    // prepare misc album data
    const releaseDate = formatDate(spotifyAlbum.release_date);
    const releaseYear = new Date(spotifyAlbum.release_date).getFullYear();
    const runtime = getTotalDuration(spotifyAlbum);
    const image = spotifyAlbum.images[0]?.url ?? null;
    let colors: ExtractedColor[] = data.colors || [];
    if (!colors.length && image) {
      try {
        colors = await getImageColors(image);
      } catch (err) {
        console.error("Color extraction failed:", err);
      }
    }

    // create album, tracks, genres, links and score refresh as one atomic unit
    return await db.transaction(async tx => {
      const album = await AlbumModel.createAlbum(
        {
          name: spotifyAlbum.name,
          spotifyID: spotifyAlbum.id,
          releaseDate,
          releaseYear,
          imageURLs: spotifyAlbum.images,
          runtime,
          reviewContent: data.reviewContent,
          reviewScore: baseScore,
          bonus: data.bonus,
          finalScore,
          affectsArtistScore: scoreArtistIDs.length > 0,
          artistSpotifyID: primaryArtist.spotifyID,
          artistName: primaryArtist.name,
          colors: colors.map(c => ({ hex: c.hex })),
          genres: data.genres,
          albumArtists,
        },
        tx
      );

      const genreIDs = await ReviewService.findOrCreateGenreIDs(data.genres, tx);

      // Link new genres & bump related strengths
      await GenreModel.linkGenresToAlbum(album.spotifyID, genreIDs, tx);
      await GenreModel.incrementRelatedStrength(genreIDs, tx);

      await ReviewService.saveAlbumArtistLinks(album.spotifyID, selectedArtistIDs, scoreArtistIDs, tx);

      const linkableArtistIDs = await ReviewService.findLinkableArtistIDs(
        spotifyAlbum.tracks.items.flatMap(track => track.artists.map(a => a.id)),
        selectedArtistIDs
      );

      for (const track of data.ratedTracks) {
        const t = spotifyAlbum.tracks.items.find(i => i.id === track.spotifyID);
        if (!t) continue;
        await TrackModel.createTrack(
          {
            albumSpotifyID: album.spotifyID,
            artistSpotifyID: primaryArtist.spotifyID,
            artistName: primaryArtist.name,
            name: t.name,
            spotifyID: t.id,
            duration: t.duration_ms,
            features: t.artists.filter(x => !selectedArtistIDs.includes(x.id)).map(x => ({ id: x.id, name: x.name })),
            rating: track.rating ?? 0,
            pick: track.pick ?? null,
          },
          tx
        );
        const linkArtistIDs = t.artists.map(a => a.id).filter(id => linkableArtistIDs.has(id));
        await TrackModel.linkArtistsToTrack(t.id, linkArtistIDs, tx);
      }

      // Remove from bookmarks
      const isBookmarked = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
      if (isBookmarked) {
        await BookmarkedAlbumModel.removeBookmarkedAlbum(album.spotifyID, tx);
      }

      await ReviewService.refreshArtists(selectedArtistIDs, tx);

      return album;
    });
  }

  static async deleteAlbum(id: string) {
    const album = await AlbumModel.findBySpotifyID(id);
    if (!album) throw new AppError("Album not found", 404);
    const artistIDs = await AlbumModel.getAlbumArtistIDs(id);

    const oldIDs = await GenreModel.getGenreIDsForAlbum(id);

    await db.transaction(async tx => {
      // Remove old genres, decrement related strengths and delete genres if unused
      await GenreModel.unlinkGenresFromAlbum(id, oldIDs, tx);
      await GenreModel.decrementRelatedStrength(oldIDs, tx);
      await GenreService.deleteIfUnused(oldIDs, tx);

      // Remove tracks and album
      await TrackModel.deleteTracksByAlbumID(id, tx);
      await AlbumModel.deleteAlbum(id, tx);

      await ReviewService.refreshArtists(artistIDs, tx);
    });
  }

  static async updateAlbumReview(data: ReceivedReviewData, albumID: string) {
    const existingAlbum = await AlbumModel.findBySpotifyID(albumID);
    if (!existingAlbum) throw new AppError("Album not found", 404);

    const existingTracks = await TrackModel.getTracksByAlbumID(albumID);
    const { baseScore, finalScore } = calculateAlbumScore(data.ratedTracks, data.bonus);

    let albumArtists = await ReviewService.resolveAlbumArtists(data.album ?? existingAlbum);
    if (albumArtists.length === 0 && existingAlbum.albumArtists?.length) {
      // Preserve existing album artists if the update payload omits them
      albumArtists = existingAlbum.albumArtists;
    }
    const selectedArtistIDs = ReviewService.resolveSelectedArtistIDs(data.selectedArtistIDs, albumArtists);
    // Preserve "no score" state if all score toggles are off
    const scoreArtistIDs = ReviewService.resolveScoreArtistIDs(data.scoreArtistIDs, selectedArtistIDs, albumArtists.length === 1 ? data.affectsArtistScore : undefined);
    const primaryArtist = albumArtists.find(a => selectedArtistIDs.includes(a.spotifyID)) ??
      albumArtists[0] ?? {
        spotifyID: existingAlbum.artistSpotifyID,
        name: existingAlbum.artistName,
        imageURLs: existingAlbum.imageURLs,
      };

    const previousArtistIDs = await AlbumModel.getAlbumArtistIDs(albumID);
    const addedArtistIDs = selectedArtistIDs.filter(id => !previousArtistIDs.includes(id));
    const removedArtistIDs = previousArtistIDs.filter(id => !selectedArtistIDs.includes(id));

    // Ensure any newly added artists exist before updates
    await ReviewService.ensureArtists(addedArtistIDs, albumArtists, scoreArtistIDs, finalScore);

    await db.transaction(async tx => {
      // update review fields and AAS flag
      await AlbumModel.updateAlbum(
        albumID,
        {
          reviewContent: data.reviewContent,
          genres: data.genres,
          colors: data.colors,
          reviewScore: baseScore,
          bonus: data.bonus,
          finalScore: finalScore,
          affectsArtistScore: scoreArtistIDs.length > 0,
          artistSpotifyID: primaryArtist.spotifyID,
          artistName: primaryArtist.name,
          albumArtists,
        },
        tx
      );

      await ReviewService.saveAlbumArtistLinks(albumID, selectedArtistIDs, scoreArtistIDs, tx);
      await AlbumModel.unlinkArtistsFromAlbum(albumID, removedArtistIDs, tx);

      const linkableArtistIDs = await ReviewService.findLinkableArtistIDs(
        data.ratedTracks.flatMap(track => [track.artistSpotifyID, ...track.features.map(f => f.id)]),
        selectedArtistIDs
      );

      for (const newTrack of data.ratedTracks) {
        const oldTrack = existingTracks.find(t => t.spotifyID === newTrack.spotifyID);

        if (!oldTrack) {
          // new track
          await TrackModel.createTrack(
            {
              albumSpotifyID: albumID,
              artistSpotifyID: newTrack.artistSpotifyID,
              artistName: newTrack.artistName,
              name: newTrack.name,
              spotifyID: newTrack.spotifyID,
              duration: newTrack.duration,
              features: newTrack.features,
              rating: newTrack.rating ?? 0,
              pick: newTrack.pick ?? null,
            },
            tx
          );
        } else if (oldTrack.rating !== newTrack.rating) {
          // just a rating change
          if (newTrack.rating !== undefined) {
            await TrackModel.updateTrackRating(newTrack.spotifyID, newTrack.rating, tx);
          }
        }

        if (oldTrack && oldTrack.pick !== (newTrack.pick ?? null)) {
          await TrackModel.updateTrackPick(newTrack.spotifyID, newTrack.pick ?? null, tx);
        }

        if (oldTrack && JSON.stringify(oldTrack.features ?? []) !== JSON.stringify(newTrack.features ?? [])) {
          await TrackModel.updateTrackFeatures(newTrack.spotifyID, newTrack.features, tx);
        }
        const linkArtistIDs = [newTrack.artistSpotifyID, ...newTrack.features.map(f => f.id)].filter(id => linkableArtistIDs.has(id));
        await TrackModel.unlinkArtistsFromTrack(newTrack.spotifyID, tx);
        await TrackModel.linkArtistsToTrack(newTrack.spotifyID, linkArtistIDs, tx);
      }

      const oldIDs = await GenreModel.getGenreIDsForAlbum(albumID);
      const newIDs = await ReviewService.findOrCreateGenreIDs(data.genres, tx);
      const toAdd = newIDs.filter(nid => !oldIDs.includes(nid));
      const toRemove = oldIDs.filter(oid => !newIDs.includes(oid));

      // Add new genres and increment related strengths
      await GenreModel.linkGenresToAlbum(albumID, toAdd, tx);
      await GenreModel.incrementRelatedStrength(toAdd, tx);

      // Remove old genres, decrement related strengths and delete if unused
      await GenreModel.unlinkGenresFromAlbum(albumID, toRemove, tx);
      await GenreModel.decrementRelatedStrength(toRemove, tx);
      await GenreService.deleteIfUnused(toRemove, tx);

      await ReviewService.refreshArtists([...new Set([...previousArtistIDs, ...selectedArtistIDs])], tx);
    });

    return AlbumModel.findBySpotifyID(albumID);
  }

  /** Turns genre names into genre IDs, and creates any genre that doesn't exist yet. */
  private static async findOrCreateGenreIDs(names: string[], executor: Executor) {
    // One at a time, not Promise.all: the queries share the transaction's single connection
    const genreIDs: number[] = [];
    for (const name of names) {
      genreIDs.push(await GenreService.findOrCreateGenre(name, executor));
    }
    return genreIDs;
  }

  /** Saves which artists the album is credited to, and which of them it counts towards. */
  private static async saveAlbumArtistLinks(albumSpotifyID: string, selectedArtistIDs: string[], scoreArtistIDs: string[], executor: Executor) {
    await AlbumModel.upsertAlbumArtists(
      albumSpotifyID,
      selectedArtistIDs.map(artistSpotifyID => ({
        artistSpotifyID,
        affectsScore: scoreArtistIDs.includes(artistSpotifyID),
      })),
      executor
    );
  }

  /** Finds the artists a track can be linked to: the tracks' artists that are already saved, and the album's credited artists. */
  private static async findLinkableArtistIDs(trackArtistIDs: string[], selectedArtistIDs: string[]) {
    const savedArtists = await ArtistModel.getArtistsBySpotifyIDs([...new Set(trackArtistIDs)]);
    return new Set([...savedArtists.map(artist => artist.spotifyID), ...selectedArtistIDs]);
  }

  private static resolveSelectedArtistIDs(selectedArtistIDs: string[] | undefined, albumArtists: AlbumArtist[]) {
    if (albumArtists.length === 0) {
      return selectedArtistIDs ?? [];
    }
    const candidateIDs = selectedArtistIDs && selectedArtistIDs.length > 0 ? selectedArtistIDs : albumArtists.map(a => a.spotifyID);
    const allowed = new Set(albumArtists.map(a => a.spotifyID));
    const filtered = candidateIDs.filter(id => allowed.has(id));
    return filtered.length > 0 ? filtered : [albumArtists[0].spotifyID];
  }

  private static resolveScoreArtistIDs(scoreArtistIDs: string[] | undefined, selectedArtistIDs: string[], soloAffectsScore: boolean | undefined) {
    // Solo albums keep the global toggle behavior
    if (soloAffectsScore !== undefined) {
      return soloAffectsScore ? selectedArtistIDs : [];
    }
    if (scoreArtistIDs === undefined) {
      return [...selectedArtistIDs];
    }
    const allowed = new Set(selectedArtistIDs);
    return scoreArtistIDs.filter(id => allowed.has(id));
  }

  private static async resolveAlbumArtists(album: ReceivedSpotifyAlbum | ReceivedReviewedAlbum): Promise<AlbumArtist[]> {
    if ("albumArtists" in album && album.albumArtists?.length) {
      return album.albumArtists;
    }
    if (isSpotifyAlbum(album)) {
      return album.artists.map(a => ({
        spotifyID: a.id,
        name: a.name,
        imageURLs: [],
      }));
    }
    return [];
  }

  private static async ensureArtists(artistIDs: string[], albumArtists: AlbumArtist[], scoreArtistIDs: string[], finalScore: number) {
    const infoMap = new Map(albumArtists.map(a => [a.spotifyID, a]));
    const existingArtists = await ArtistModel.getArtistsBySpotifyIDs(artistIDs);
    const existingIDs = new Set(existingArtists.map(a => a.spotifyID));

    for (const artistID of artistIDs) {
      if (!existingIDs.has(artistID)) {
        const info = infoMap.get(artistID);
        if (!info) continue;

        let headerImage: string | null = null;
        try {
          headerImage = await fetchArtistHeaderFromSpotify(artistID);
        } catch (err) {
          console.warn("Could not fetch artist header image, skipping scraper:", err);
        }

        const affectsScore = scoreArtistIDs.includes(artistID);
        const score = affectsScore ? finalScore : 0;
        await ArtistModel.createArtist({
          name: info.name,
          spotifyID: artistID,
          imageURLs: info.imageURLs,
          headerImage,
          totalScore: score,
          reviewCount: 0,
          unrated: !affectsScore,
          leaderboardPosition: null,
        });

        // Backfill any existing featured tracks now that the artist exists
        const featuredTracks = await TrackModel.getTracksFeaturingArtist(artistID);
        for (const track of featuredTracks) {
          await TrackModel.linkArtistsToTrack(track.spotifyID, [artistID]);
        }
      }
    }
  }

  private static async refreshArtists(artistIDs: string[], executor: Executor = db) {
    const uniqueArtistIDs = Array.from(new Set(artistIDs)).filter(Boolean);
    if (uniqueArtistIDs.length === 0) return;

    const existingArtists = await ArtistModel.getArtistsBySpotifyIDs(uniqueArtistIDs, executor);
    if (existingArtists.length === 0) return;

    const scores = await ArtistScoreService.calculateScores(
      existingArtists.map(artist => artist.spotifyID),
      executor
    );

    for (const artist of existingArtists) {
      const fields = scores.get(artist.spotifyID);
      if (fields) {
        await ArtistModel.updateArtist(artist.spotifyID, fields, executor);
      } else {
        await ArtistModel.deleteArtist(artist.spotifyID, executor);
      }
    }

    await ArtistScoreService.updateAllLeaderboardPositions(executor);
  }
}
