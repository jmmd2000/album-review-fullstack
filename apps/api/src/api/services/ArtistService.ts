import type { DisplayArtist, GetPaginatedArtistsOptions, DisplayTrack, SpotifyImage, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { toSortableDate } from "@shared/helpers/formatDate";
import { fetchArtistHeadersFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import type { JobEmit } from "@/api/services/JobService";
import { areImageUrlsSame, normalizeSpotifyImageUrl } from "@/helpers/normaliseSpotifyImageURL";
import { SettingsService } from "./SettingsService";
import type { ArtistLeaderboardData } from "@/helpers/calculateLeaderboardPositions";
import { calculateLeaderboardPositions } from "@/helpers/calculateLeaderboardPositions";
import { calculateArtistScore } from "@/helpers/calculateArtistScore";
import { AppError } from "@/api/AppError";
import { db, type Executor } from "@/db/client";
import { PAGE_SIZE } from "@shared/constants";

export class ArtistService {
  /**
   * Recalculates the scores of all artists from their albums. It saves only the scores that change,
   * then updates the leaderboard positions.
   */
  static async recalculateAllArtistScores() {
    const artists = await ArtistModel.getAllArtists();
    const initialSnapshot = new Map<
      string,
      {
        name: string;
        averageScore: number;
        bonusPoints: number;
        totalScore: number;
        peakScore: number;
        latestScore: number;
        reviewCount: number;
        unrated: boolean;
        leaderboardPosition: number | null;
        peakLeaderboardPosition: number | null;
        latestLeaderboardPosition: number | null;
      }
    >();

    for (const a of artists) {
      initialSnapshot.set(a.spotifyID, {
        name: a.name,
        averageScore: a.averageScore,
        bonusPoints: a.bonusPoints,
        totalScore: a.totalScore,
        peakScore: a.peakScore,
        latestScore: a.latestScore,
        reviewCount: a.reviewCount,
        unrated: a.unrated,
        leaderboardPosition: a.leaderboardPosition,
        peakLeaderboardPosition: a.peakLeaderboardPosition,
        latestLeaderboardPosition: a.latestLeaderboardPosition,
      });
    }

    const hasNumericChange = (current: number, next: number) => Math.abs((current ?? 0) - next) > 0.0001;

    const allAlbumLinks = await AlbumModel.getAlbumsByArtistsWithAffects(artists.map(a => a.spotifyID));

    await db.transaction(async tx => {
      for (const artist of artists) {
        const albumLinks = allAlbumLinks.get(artist.spotifyID) ?? [];
        const albums = albumLinks.map(link => link.album) as ReviewedAlbum[];
        const reviewCount = albums.length;
        const contributing = albumLinks.filter(link => link.affectsScore).map(link => link.album) as ReviewedAlbum[];

        if (contributing.length === 0) {
          const updates = {
            unrated: true,
            averageScore: 0,
            bonusPoints: 0,
            totalScore: 0,
            peakScore: 0,
            latestScore: 0,
            bonusReason: JSON.stringify([]),
            reviewCount,
            leaderboardPosition: null,
            peakLeaderboardPosition: null,
            latestLeaderboardPosition: null,
          };

          const needsUpdate =
            artist.unrated === false ||
            hasNumericChange(artist.averageScore, 0) ||
            hasNumericChange(artist.bonusPoints, 0) ||
            hasNumericChange(artist.totalScore, 0) ||
            hasNumericChange(artist.peakScore, 0) ||
            hasNumericChange(artist.latestScore, 0) ||
            (artist.bonusReason ?? "[]") !== updates.bonusReason ||
            artist.reviewCount !== reviewCount ||
            artist.leaderboardPosition !== null ||
            artist.peakLeaderboardPosition !== null ||
            artist.latestLeaderboardPosition !== null;

          if (needsUpdate) {
            await ArtistModel.updateArtist(artist.spotifyID, updates, tx);
          }
          continue;
        }

        const { newAverageScore, newBonusPoints, totalScore, peakScore, latestScore, bonusReasons } = calculateArtistScore(contributing);

        const updates = {
          averageScore: newAverageScore,
          bonusPoints: newBonusPoints,
          totalScore,
          peakScore,
          latestScore,
          bonusReason: JSON.stringify(bonusReasons),
          reviewCount,
          unrated: false,
        };

        const needsUpdate =
          artist.unrated ||
          hasNumericChange(artist.averageScore, newAverageScore) ||
          hasNumericChange(artist.bonusPoints, newBonusPoints) ||
          hasNumericChange(artist.totalScore, totalScore) ||
          hasNumericChange(artist.peakScore, peakScore) ||
          hasNumericChange(artist.latestScore, latestScore) ||
          (artist.bonusReason ?? "[]") !== updates.bonusReason ||
          artist.reviewCount !== reviewCount;

        if (needsUpdate) {
          await ArtistModel.updateArtist(artist.spotifyID, updates, tx);
        }
      }

      if (artists.length > 0) {
        await ArtistService.updateAllLeaderboardPositions(tx);
      }
    });

    const refreshed = await ArtistModel.getAllArtists();
    const changedArtists: {
      spotifyID: string;
      name: string;
      changes: {
        field:
          "totalScore" | "peakScore" | "latestScore" | "averageScore" | "bonusPoints" | "reviewCount" | "unrated" | "leaderboardPosition" | "peakLeaderboardPosition" | "latestLeaderboardPosition";
        before: number | null;
        after: number | null;
      }[];
    }[] = [];

    for (const artist of refreshed) {
      const before = initialSnapshot.get(artist.spotifyID);
      if (!before) continue;

      const after = {
        averageScore: artist.averageScore,
        bonusPoints: artist.bonusPoints,
        totalScore: artist.totalScore,
        peakScore: artist.peakScore,
        latestScore: artist.latestScore,
        reviewCount: artist.reviewCount,
        unrated: artist.unrated,
        leaderboardPosition: artist.leaderboardPosition,
        peakLeaderboardPosition: artist.peakLeaderboardPosition,
        latestLeaderboardPosition: artist.latestLeaderboardPosition,
      };

      const changes: {
        field:
          "totalScore" | "peakScore" | "latestScore" | "averageScore" | "bonusPoints" | "reviewCount" | "unrated" | "leaderboardPosition" | "peakLeaderboardPosition" | "latestLeaderboardPosition";
        before: number | null;
        after: number | null;
      }[] = [];

      const addChange = (
        field:
          "totalScore" | "peakScore" | "latestScore" | "averageScore" | "bonusPoints" | "reviewCount" | "unrated" | "leaderboardPosition" | "peakLeaderboardPosition" | "latestLeaderboardPosition",
        beforeVal: number | null,
        afterVal: number | null
      ) => {
        changes.push({ field, before: beforeVal, after: afterVal });
      };

      if (hasNumericChange(before.totalScore, after.totalScore)) {
        addChange("totalScore", before.totalScore, after.totalScore);
      }
      if (hasNumericChange(before.peakScore, after.peakScore)) {
        addChange("peakScore", before.peakScore, after.peakScore);
      }
      if (hasNumericChange(before.latestScore, after.latestScore)) {
        addChange("latestScore", before.latestScore, after.latestScore);
      }
      if (hasNumericChange(before.averageScore, after.averageScore)) {
        addChange("averageScore", before.averageScore, after.averageScore);
      }
      if (hasNumericChange(before.bonusPoints, after.bonusPoints)) {
        addChange("bonusPoints", before.bonusPoints, after.bonusPoints);
      }
      if (before.reviewCount !== after.reviewCount) {
        addChange("reviewCount", before.reviewCount, after.reviewCount);
      }
      if (before.unrated !== after.unrated) {
        addChange("unrated", Number(before.unrated), Number(after.unrated));
      }
      if (before.leaderboardPosition !== after.leaderboardPosition) {
        addChange("leaderboardPosition", before.leaderboardPosition, after.leaderboardPosition);
      }
      if (before.peakLeaderboardPosition !== after.peakLeaderboardPosition) {
        addChange("peakLeaderboardPosition", before.peakLeaderboardPosition, after.peakLeaderboardPosition);
      }
      if (before.latestLeaderboardPosition !== after.latestLeaderboardPosition) {
        addChange("latestLeaderboardPosition", before.latestLeaderboardPosition, after.latestLeaderboardPosition);
      }

      if (changes.length > 0) {
        changedArtists.push({
          spotifyID: artist.spotifyID,
          name: artist.name,
          changes,
        });
      }
    }

    return {
      updatedCount: changedArtists.length,
      totalProcessed: artists.length,
      changedArtists,
    };
  }

  /** Updates the overall, peak and latest leaderboard positions of all rated artists. */
  static async updateAllLeaderboardPositions(executor: Executor = db) {
    const allArtists = await ArtistModel.getAllArtists(executor);
    const ratedArtists = allArtists.filter(artist => !artist.unrated);

    if (ratedArtists.length === 0) return;

    const overallData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.totalScore,
    }));

    const peakData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.peakScore,
    }));

    const latestData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.latestScore,
    }));

    const overallPositions = calculateLeaderboardPositions(overallData);
    const peakPositions = calculateLeaderboardPositions(peakData);
    const latestPositions = calculateLeaderboardPositions(latestData);

    for (const artist of overallPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, artist.position!, executor);
    }

    for (const artist of peakPositions) {
      await ArtistModel.updatePeakLeaderboardPosition(artist.id, artist.position!, executor);
    }

    for (const artist of latestPositions) {
      await ArtistModel.updateLatestLeaderboardPosition(artist.id, artist.position!, executor);
    }
  }
  static async getAllArtists() {
    return ArtistModel.getAllArtists();
  }

  static async getPaginatedArtists(opts: GetPaginatedArtistsOptions) {
    const artists = await ArtistModel.getPaginatedArtists(opts);
    const totalArtistCount = await ArtistModel.getArtistCount();
    const furtherPages = artists.length > PAGE_SIZE;
    if (furtherPages) artists.pop();

    const displayArtists: DisplayArtist[] = artists.map(artist => ({
      spotifyID: artist.spotifyID,
      name: artist.name,
      imageURLs: artist.imageURLs,
      totalScore: artist.totalScore,
      peakScore: artist.peakScore,
      latestScore: artist.latestScore,
      unrated: artist.unrated,
      albumCount: artist.reviewCount,
      leaderboardPosition: artist.leaderboardPosition,
      peakLeaderboardPosition: artist.peakLeaderboardPosition,
      latestLeaderboardPosition: artist.latestLeaderboardPosition,
    }));

    return {
      artists: displayArtists,
      furtherPages,
      totalCount: totalArtistCount,
    };
  }

  static async getArtistByID(artistID: string) {
    const artist = await ArtistModel.getArtistBySpotifyID(artistID);
    if (!artist) throw new AppError("Artist not found.", 404);
    return artist;
  }

  static async getArtistDetails(artistID: string) {
    const artist = await ArtistModel.getArtistBySpotifyID(artistID);
    if (!artist) throw new AppError("Artist not found", 404);

    const albums = await AlbumModel.getAlbumsByArtist(artistID);
    const sortByDateDesc = <T extends { releaseDate: string; releaseYear: number }>(a: T, b: T) => {
      const dateA = new Date(toSortableDate(a.releaseDate, a.releaseYear)).getTime();
      const dateB = new Date(toSortableDate(b.releaseDate, b.releaseYear)).getTime();
      return dateB - dateA;
    };
    const sortedAlbums = albums.sort(sortByDateDesc);

    const featuredAlbumIDs = await AlbumModel.getFeaturedAlbumIDsByArtist(artistID);
    const featuredAlbums = (await AlbumModel.getAlbumsBySpotifyIDs(featuredAlbumIDs)).sort(sortByDateDesc);

    const albumIDs = [...new Set([...sortedAlbums, ...featuredAlbums].map(a => a.spotifyID))];
    const artistIDMap = await AlbumModel.getAlbumArtistIDsForAlbums(albumIDs);
    const albumsWithArtists = sortedAlbums.map(album => ({
      ...album,
      artistSpotifyIDs: artistIDMap.get(album.spotifyID) ?? [],
    }));
    const featuredWithArtists = featuredAlbums.map(album => ({
      ...album,
      artistSpotifyIDs: artistIDMap.get(album.spotifyID) ?? [],
    }));

    const allAlbumsNewestFirst = [...albumsWithArtists, ...featuredWithArtists].sort(sortByDateDesc);
    const albumsByID = new Map(allAlbumsNewestFirst.map(album => [album.spotifyID, album]));
    const albumPositions = new Map(allAlbumsNewestFirst.map((album, index) => [album.spotifyID, index]));
    const albumPosition = (albumSpotifyID: string) => albumPositions.get(albumSpotifyID) ?? albumPositions.size;

    // The sort is stable, so each album's tracks stay in album order
    const tracks = (await TrackModel.getTracksByArtist(artistID)).sort((a, b) => albumPosition(a.albumSpotifyID) - albumPosition(b.albumSpotifyID));

    const displayTracks: DisplayTrack[] = tracks.map(track => ({
      spotifyID: track.spotifyID,
      artistSpotifyID: track.artistSpotifyID,
      name: track.name,
      artistName: track.artistName,
      duration: track.duration,
      rating: track.rating,
      features: track.features,
      imageURLs: albumsByID.get(track.albumSpotifyID)?.imageURLs ?? [],
      albumName: albumsByID.get(track.albumSpotifyID)?.name,
    }));
    const rankedArtistCount = await ArtistModel.getRankedArtistCount();

    return {
      artist,
      albums: albumsWithArtists,
      featuredAlbums: featuredWithArtists,
      tracks: displayTracks,
      rankedArtistCount,
    };
  }

  static async deleteArtist(artistID: string) {
    const artist = await ArtistModel.getArtistBySpotifyID(artistID);
    if (!artist) throw new AppError("Artist not found.", 404);
    return ArtistModel.deleteArtist(artistID);
  }

  static async updateSingleArtistHeader(spotifyID: string, headerImage: string | null): Promise<void> {
    const artist = await ArtistModel.getArtistBySpotifyID(spotifyID);
    if (!artist) throw new AppError("Artist not found.", 404);
    await ArtistModel.updateArtist(spotifyID, {
      headerImage,
      imageUpdatedAt: new Date(),
    });
  }

  static async updateArtistHeaders(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    if (!all && !spotifyID) throw new AppError("Must specify either all=true or a spotifyID", 400);

    let dbArtists;
    if (all) {
      dbArtists = await ArtistModel.getAllArtists();
    } else {
      const artist = await ArtistModel.getArtistBySpotifyID(spotifyID!);
      if (!artist) throw new AppError("Artist not found", 404);
      dbArtists = [artist];
    }

    const FAKE = false;
    const BATCH_SIZE = 6;

    const artists: ReviewedArtist[] = dbArtists.map(a => ({
      ...a,
      leaderboardPosition: a.leaderboardPosition ?? 0,
    }));

    const total = artists.length;

    const batches = [];
    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
      batches.push(artists.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const spotifyIDs = batch.map(a => a.spotifyID);

      const onProgress = (completed: number, _totalInBatch: number, currentArtistID?: string) => {
        if (currentArtistID) {
          const currentArtist = batch.find(a => a.spotifyID === currentArtistID);
          const artistName = currentArtist?.name || "Unknown Artist";
          const artistImage = currentArtist?.imageURLs?.[0]?.url;

          emit("fetching", {
            index: processedCount + completed,
            total,
            spotifyID: currentArtistID,
            artistName: `${FAKE ? "[FAKE] " : ""}${artistName}`,
            artistImage,
          });
        }
      };

      const headerResults = await fetchArtistHeadersFromSpotify(spotifyIDs, BATCH_SIZE, onProgress, FAKE);

      for (let i = 0; i < batch.length; i++) {
        const artist = batch[i];
        const { spotifyID: id, name, imageURLs } = artist;
        const artistImage = imageURLs?.[0]?.url;

        processedCount++;

        // Send progress first. The live banner on the settings page updates from it.
        emit("progress", {
          index: processedCount,
          total,
          spotifyID: id,
          artistName: name,
          artistImage,
        });

        const newHeaderImage = headerResults[id];

        if (newHeaderImage) {
          const current = artist.headerImage;

          const normalizedCurrent = current ? normalizeSpotifyImageUrl(current) : null;
          const normalizedNew = normalizeSpotifyImageUrl(newHeaderImage);

          if (normalizedCurrent === normalizedNew) {
            emit("same", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current,
            });
          } else {
            emit("changed", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current,
              newHeaderImage: newHeaderImage,
            });

            try {
              await ArtistModel.updateArtist(id, {
                headerImage: newHeaderImage,
                imageUpdatedAt: new Date(),
              });
            } catch (err) {
              console.error(`Header update failed for ${id}:`, err);
              emit("failed", {
                spotifyID: id,
                index: processedCount,
                total,
                artistName: name,
                artistImage,
                headerImage: current,
                message: (err as Error).message,
              });
            }
          }
        } else {
          emit("failed", {
            spotifyID: id,
            total,
            index: processedCount,
            artistName: FAKE ? `[FAKE] ${name}` : name,
            artistImage,
            headerImage: null,
            message: FAKE ? "[FAKE] Failed to fetch header image" : "Failed to fetch header image",
          });
        }
      }
    }

    await SettingsService.setLastRun("headers", new Date());
  }

  static async updateArtistImages(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    if (!all && !spotifyID) throw new AppError("Must specify either all=true or a spotifyID", 400);

    let dbArtists;
    if (all) {
      dbArtists = await ArtistModel.getAllArtists();
    } else {
      const artist = await ArtistModel.getArtistBySpotifyID(spotifyID!);
      if (!artist) throw new AppError("Artist not found", 404);
      dbArtists = [artist];
    }

    const artists: ReviewedArtist[] = dbArtists.map(a => ({
      ...a,
      leaderboardPosition: a.leaderboardPosition ?? 0,
    }));

    const total = artists.length;

    for (let i = 0; i < total; i++) {
      const { spotifyID: id, name, imageURLs } = artists[i];

      const currentArtistImage = imageURLs && imageURLs.length > 0 ? imageURLs[0].url : undefined;

      emit("progress", {
        index: i + 1,
        total,
        spotifyID: id,
        artistName: name,
        artistImage: currentArtistImage,
      });

      const artistData = await fetchArtistFromSpotify(id);
      if (!artistData) continue;

      const newArtistImage = artistData.images && artistData.images.length > 0 ? (artistData.images as SpotifyImage[])[0].url : undefined;

      const currentUrls = (imageURLs || []).map(img => img.url).sort();
      const fetchedUrls = (artistData.images as SpotifyImage[]).map(img => img.url).sort();

      const same = areImageUrlsSame(currentUrls, fetchedUrls);

      if (same) {
        emit("same", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
        });
        continue;
      } else {
        emit("changed", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
          newArtistImage: newArtistImage,
        });

        try {
          await ArtistModel.updateArtist(id, {
            imageURLs: artistData.images as SpotifyImage[],
            imageUpdatedAt: new Date(),
          });
        } catch (err) {
          console.error(`Image update failed for ${id}:`, err);
          emit("failed", {
            spotifyID: id,
            artistName: name,
            artistImage: currentArtistImage,
            message: (err as Error).message,
          });
        }
      }
    }

    await SettingsService.setLastRun("images", new Date());
  }
}
