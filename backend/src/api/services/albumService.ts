import "dotenv/config";
import {
  DisplayAlbum,
  ExtractedColor,
  DisplayTrack,
  GetPaginatedAlbumsOptions,
  ReviewedAlbum,
  ReviewedArtist,
  ReviewedTrack,
  SpotifyAlbum,
  RelatedGenre,
  PaginatedAlbumsResult,
  Genre,
  AlbumArtist,
} from "@shared/types";
import { ReceivedReviewData } from "@/api/controllers/albumController";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { ArtistModel } from "@/api/models/Artist";
import { fetchArtistHeaderFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import {
  ArtistLeaderboardData,
  calculateLeaderboardPositions,
} from "@/helpers/calculateLeaderboardPositions";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { calculateArtistScore } from "@/helpers/calculateArtistScore";
import { ArtistService } from "./artistService";
import { formatDate } from "@shared/helpers/formatDate";
import getTotalDuration from "@shared/helpers/formatDuration";
import { getImageColors } from "@/helpers/getImageColors";
import { BookmarkedAlbumModel } from "../models/BookmarkedAlbum";
import { GenreModel } from "@/api/models/Genre";
import { GenreService } from "./genreService";
import { AppError } from "../middleware/errorHandler";

// albumService.ts (or a helpers file)
function isSpotifyAlbum(a: any): a is SpotifyAlbum {
  return (
    typeof a === "object" &&
    typeof a.id === "string" &&
    Array.isArray(a.artists) &&
    typeof a.uri === "string"
  );
}

export class AlbumService {
  static async createAlbumReview(data: ReceivedReviewData) {
    if (!isSpotifyAlbum(data.album))
      throw new Error("Invalid album data: Expected a SpotifyAlbum, received something else");

    const spotifyAlbum = data.album;
    if (await AlbumModel.findBySpotifyID(spotifyAlbum.id)) {
      throw new AppError("You have already reviewed this album.", 400);
    }

    // calculate album score
    const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);

    const albumArtists = await AlbumService.resolveAlbumArtists(spotifyAlbum);
    if (albumArtists.length === 0) {
      throw new Error("Album artists could not be resolved");
    }
    const selectedArtistIDs = AlbumService.resolveSelectedArtistIDs(
      data.selectedArtistIDs,
      albumArtists
    );
    // Allow per-artist scoring for collabs, but keep the solo toggle behavior
    const scoreArtistIDs = AlbumService.resolveScoreArtistIDs(
      data.scoreArtistIDs,
      selectedArtistIDs,
      albumArtists.length === 1 ? data.affectsArtistScore : undefined
    );
    const primaryArtist =
      albumArtists.find(a => selectedArtistIDs.includes(a.spotifyID)) ?? albumArtists[0];

    // Ensure all selected artists exist before linking tracks/albums
    await AlbumService.ensureArtists(
      selectedArtistIDs,
      albumArtists,
      scoreArtistIDs,
      finalScore
    );

    // prepare misc album data
    const releaseDate = formatDate(spotifyAlbum.release_date);
    const releaseYear = new Date(spotifyAlbum.release_date).getFullYear();
    const runtime = getTotalDuration(spotifyAlbum);
    const image = spotifyAlbum.images[0]?.url ?? null;
    let colors: ExtractedColor[] = data.colors || [];
    if (!colors.length) {
      try {
        colors = await getImageColors(image!);
      } catch (err) {
        console.error("Color extraction failed:", err);
      }
    }

    // create album
    const album = await AlbumModel.createAlbum({
      name: spotifyAlbum.name,
      spotifyID: spotifyAlbum.id,
      releaseDate,
      releaseYear,
      imageURLs: spotifyAlbum.images,
      bestSong: data.bestSong,
      worstSong: data.worstSong,
      runtime,
      reviewContent: data.reviewContent,
      reviewScore: baseScore,
      reviewBonuses: bonuses,
      finalScore,
      affectsArtistScore: scoreArtistIDs.length > 0,
      artistSpotifyID: primaryArtist.spotifyID,
      artistName: primaryArtist.name,
      colors: colors.map(c => ({ hex: c.hex })),
      genres: data.genres,
      albumArtists,
    });

    const genreIDs = await Promise.all(
      data.genres.map(name => GenreService.findOrCreateGenre(name))
    );

    // Link new genres & bump related strengths
    await GenreModel.linkGenresToAlbum(album.spotifyID, genreIDs);
    await GenreModel.incrementRelatedStrength(genreIDs);

    await AlbumModel.upsertAlbumArtists(
      album.spotifyID,
      selectedArtistIDs.map(artistSpotifyID => ({
        artistSpotifyID,
        affectsScore: scoreArtistIDs.includes(artistSpotifyID),
      }))
    );

    // create track entries
    const trackArtistIDs = Array.from(
      new Set(spotifyAlbum.tracks.items.flatMap(track => track.artists.map(a => a.id)))
    );
    const existingTrackArtists = await ArtistModel.getArtistsBySpotifyIDs(trackArtistIDs);
    const existingArtistIDs = new Set(existingTrackArtists.map(a => a.spotifyID));
    selectedArtistIDs.forEach(id => existingArtistIDs.add(id));

    for (const track of data.ratedTracks) {
      const t = spotifyAlbum.tracks.items.find(i => i.id === track.spotifyID);
      if (!t) continue;
      await TrackModel.createTrack({
        albumSpotifyID: album.spotifyID,
        artistSpotifyID: primaryArtist.spotifyID,
        artistName: primaryArtist.name,
        name: t.name,
        spotifyID: t.id,
        duration: t.duration_ms,
        features: t.artists
          .filter(x => !selectedArtistIDs.includes(x.id))
          .map(x => ({ id: x.id, name: x.name })),
        rating: track.rating!,
      });
      const linkArtistIDs = t.artists.map(a => a.id).filter(id => existingArtistIDs.has(id));
      await TrackModel.linkArtistsToTrack(t.id, linkArtistIDs);
    }

    // Remove from bookmarks
    const isBookmarked = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
    if (isBookmarked) {
      await BookmarkedAlbumModel.removeBookmarkedAlbum(album.spotifyID);
    }

    await AlbumService.refreshArtists(selectedArtistIDs);

    return album;
  }

  static async getAlbumByID(
    id: string,
    includeGenres: boolean = true
  ): Promise<{
    album: ReviewedAlbum;
    artists: ReviewedArtist[];
    tracks: DisplayTrack[];
    allGenres?: Genre[];
    albumGenres?: Genre[];
  }> {
    const album = (await AlbumModel.findBySpotifyID(id)) as ReviewedAlbum;
    const artistLinks = await AlbumModel.getAlbumArtistLinks(album.spotifyID);
    const artistIDs = artistLinks.map(link => link.artistSpotifyID);
    const artists = (await ArtistModel.getArtistsBySpotifyIDs(artistIDs)) as ReviewedArtist[];
    album.artistSpotifyIDs = artistIDs;
    album.artistScoreIDs = artistLinks
      .filter(link => link.affectsScore)
      .map(link => link.artistSpotifyID);
    const tracks = await TrackModel.getTracksByAlbumID(id);

    const displayTracks: DisplayTrack[] = tracks.map(track => ({
      name: track.name,
      artistName: track.artistName,
      artistSpotifyID: track.artistSpotifyID,
      spotifyID: track.spotifyID,
      duration: track.duration,
      rating: track.rating,
      features: track.features,
    }));

    if (!includeGenres) {
      return { album, artists, tracks: displayTracks };
    }

    const albumGenres = await GenreService.getGenresForAlbums([album.spotifyID]);
    const allGenres = await GenreModel.getAllGenres();

    return { album, artists, tracks: displayTracks, allGenres, albumGenres };
  }

  static async getAllAlbums(includeCounts = false) {
    const albums = await AlbumModel.getAllAlbums();
    const albumIDs = albums.map(album => album.spotifyID);
    const artistMap = await AlbumModel.getAlbumArtistIDsForAlbums(albumIDs);
    const displayAlbums: DisplayAlbum[] = albums.map(album => ({
      name: album.name,
      spotifyID: album.spotifyID,
      imageURLs: album.imageURLs,
      finalScore: album.finalScore,
      affectsArtistScore: album.affectsArtistScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      albumArtists: album.albumArtists,
      artistSpotifyIDs: artistMap.get(album.spotifyID) ?? [],
    }));

    if (!includeCounts) return { albums: displayAlbums };

    const numArtists = await ArtistModel.getArtistCount();
    const numAlbums = await AlbumModel.getAlbumCount();
    const numTracks = await TrackModel.getTrackCount();

    return { albums: displayAlbums, numArtists, numAlbums, numTracks };
  }

  static async getPaginatedAlbums(
    opts: GetPaginatedAlbumsOptions
  ): Promise<PaginatedAlbumsResult> {
    const { albums, totalCount, furtherPages } = await AlbumModel.getPaginatedAlbums(opts);

    // const relatedGenres = opts.genres?.length ? await GenreModel.getRelatedGenres(opts.genres) : [];

    const relevantGenres = opts.genres?.length
      ? await GenreService.getGenresForAlbums(albums.map(a => a.spotifyID))
      : [];

    const genres: Genre[] = await GenreModel.getAllGenres();
    genres.sort((a, b) => a.name.localeCompare(b.name));

    const displayAlbums: DisplayAlbum[] = albums.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      finalScore: album.finalScore,
      affectsArtistScore: album.affectsArtistScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      albumArtists: album.albumArtists,
    }));

    const artistMap = await AlbumModel.getAlbumArtistIDsForAlbums(
      albums.map(a => a.spotifyID)
    );
    for (const displayAlbum of displayAlbums) {
      displayAlbum.artistSpotifyIDs = artistMap.get(displayAlbum.spotifyID) ?? [];
    }

    return {
      albums: displayAlbums,
      furtherPages,
      totalCount,
      genres,
      relatedGenres: relevantGenres,
    };
  }

  static async deleteAlbum(id: string) {
    const album = (await AlbumModel.findBySpotifyID(id)) as ReviewedAlbum;
    if (!album) throw new AppError("Album not found", 404);
    const artistIDs = await AlbumModel.getAlbumArtistIDs(id);

    // Remove old genres, decrement related strengths and deleted genres if unused
    const oldIDs = await GenreModel.getGenreIDsForAlbum(id);
    await GenreModel.unlinkGenresFromAlbum(id, oldIDs);
    await GenreModel.decrementRelatedStrength(oldIDs);
    await GenreService.deleteIfUnused(oldIDs);

    // Remove tracks and album
    await TrackModel.deleteTracksByAlbumID(id);
    await AlbumModel.deleteAlbum(id);

    await AlbumService.refreshArtists(artistIDs);
  }

  static async updateAlbumReview(data: ReceivedReviewData, albumID: string) {
    const existingAlbum = (await AlbumModel.findBySpotifyID(albumID)) as ReviewedAlbum;
    if (!existingAlbum) throw new AppError("Album not found", 404);

    const existingTracks = await TrackModel.getTracksByAlbumID(albumID);
    const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);

    let albumArtists = await AlbumService.resolveAlbumArtists(data.album ?? existingAlbum);
    if (albumArtists.length === 0 && existingAlbum.albumArtists?.length) {
      // Preserve existing album artists if the update payload omits them
      albumArtists = existingAlbum.albumArtists;
    }
    const selectedArtistIDs = AlbumService.resolveSelectedArtistIDs(
      data.selectedArtistIDs,
      albumArtists
    );
    // Preserve "no score" state if all score toggles are off
    const scoreArtistIDs = AlbumService.resolveScoreArtistIDs(
      data.scoreArtistIDs,
      selectedArtistIDs,
      albumArtists.length === 1 ? data.affectsArtistScore : undefined
    );
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
    await AlbumService.ensureArtists(addedArtistIDs, albumArtists, scoreArtistIDs, finalScore);

    // update review fields and AAS flag
    await AlbumModel.updateAlbum(albumID, {
      reviewContent: data.reviewContent,
      bestSong: data.bestSong,
      worstSong: data.worstSong,
      genres: data.genres,
      colors: data.colors,
      reviewScore: baseScore,
      reviewBonuses: bonuses,
      finalScore: finalScore,
      affectsArtistScore: scoreArtistIDs.length > 0,
      artistSpotifyID: primaryArtist.spotifyID,
      artistName: primaryArtist.name,
      albumArtists,
    });

    await AlbumModel.upsertAlbumArtists(
      albumID,
      selectedArtistIDs.map(artistSpotifyID => ({
        artistSpotifyID,
        affectsScore: scoreArtistIDs.includes(artistSpotifyID),
      }))
    );
    await AlbumModel.unlinkArtistsFromAlbum(albumID, removedArtistIDs);

    const trackArtistIDs = Array.from(
      new Set(
        data.ratedTracks.flatMap(track => [
          track.artistSpotifyID,
          ...track.features.map(f => f.id),
        ])
      )
    );
    const existingTrackArtists = await ArtistModel.getArtistsBySpotifyIDs(trackArtistIDs);
    const existingArtistIDs = new Set(existingTrackArtists.map(a => a.spotifyID));
    selectedArtistIDs.forEach(id => existingArtistIDs.add(id));

    for (const newTrack of data.ratedTracks) {
      const oldTrack = existingTracks.find(t => t.spotifyID === newTrack.spotifyID);

      if (!oldTrack) {
        // new track
        await TrackModel.createTrack({
          albumSpotifyID: albumID,
          artistSpotifyID: newTrack.artistSpotifyID,
          artistName: newTrack.artistName,
          name: newTrack.name,
          spotifyID: newTrack.spotifyID,
          duration: newTrack.duration,
          features: newTrack.features,
          rating: newTrack.rating ?? 0,
        });
      } else if (oldTrack.rating !== newTrack.rating) {
        // just a rating change
        if (newTrack.rating !== undefined) {
          await TrackModel.updateTrackRating(newTrack.spotifyID, newTrack.rating);
        }
      }

      if (
        oldTrack &&
        JSON.stringify(oldTrack.features ?? []) !== JSON.stringify(newTrack.features ?? [])
      ) {
        await TrackModel.updateTrackFeatures(newTrack.spotifyID, newTrack.features);
      }
      const linkArtistIDs = [
        newTrack.artistSpotifyID,
        ...newTrack.features.map(f => f.id),
      ].filter(id => existingArtistIDs.has(id));
      await TrackModel.unlinkArtistsFromTrack(newTrack.spotifyID);
      await TrackModel.linkArtistsToTrack(newTrack.spotifyID, linkArtistIDs);
    }

    // Get new vs old genre IDs
    const oldIDs = await GenreModel.getGenreIDsForAlbum(albumID);
    const newIDs = await Promise.all(
      data.genres.map(name => GenreService.findOrCreateGenre(name))
    );
    const toAdd = newIDs.filter(nid => !oldIDs.includes(nid));
    const toRemove = oldIDs.filter(oid => !newIDs.includes(oid));

    // Add new genres and increment related strengths
    await GenreModel.linkGenresToAlbum(albumID, toAdd);
    await GenreModel.incrementRelatedStrength(toAdd);

    // Remove old genres, decrement related strengths and delete if unused
    await GenreModel.unlinkGenresFromAlbum(albumID, toRemove);
    await GenreModel.decrementRelatedStrength(toRemove);
    await GenreService.deleteIfUnused(toRemove);

    await AlbumService.refreshArtists([
      ...new Set([...previousArtistIDs, ...selectedArtistIDs]),
    ]);

    return AlbumModel.findBySpotifyID(albumID);
  }

  static async getReviewScoresByIds(ids: string[]) {
    return AlbumModel.getReviewScoresByIds(ids);
  }

  private static resolveSelectedArtistIDs(
    selectedArtistIDs: string[] | undefined,
    albumArtists: AlbumArtist[]
  ) {
    if (albumArtists.length === 0) {
      return selectedArtistIDs ?? [];
    }
    const candidateIDs =
      selectedArtistIDs && selectedArtistIDs.length > 0
        ? selectedArtistIDs
        : albumArtists.map(a => a.spotifyID);
    const allowed = new Set(albumArtists.map(a => a.spotifyID));
    const filtered = candidateIDs.filter(id => allowed.has(id));
    return filtered.length > 0 ? filtered : [albumArtists[0].spotifyID];
  }

  private static resolveScoreArtistIDs(
    scoreArtistIDs: string[] | undefined,
    selectedArtistIDs: string[],
    soloAffectsScore: boolean | undefined
  ) {
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

  private static async resolveAlbumArtists(
    album: SpotifyAlbum | ReviewedAlbum
  ): Promise<AlbumArtist[]> {
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

  private static async ensureArtists(
    artistIDs: string[],
    albumArtists: AlbumArtist[],
    scoreArtistIDs: string[],
    finalScore: number
  ) {
    const infoMap = new Map(albumArtists.map(a => [a.spotifyID, a]));

    for (const artistID of artistIDs) {
      let artist = await ArtistModel.getArtistBySpotifyID(artistID);
      if (!artist) {
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
        artist = await ArtistModel.createArtist({
          name: info.name,
          spotifyID: artistID,
          imageURLs: info.imageURLs,
          headerImage,
          averageScore: score,
          bonusPoints: 0,
          totalScore: score,
          bonusReason: JSON.stringify([]),
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

  private static async refreshArtists(artistIDs: string[]) {
    const uniqueArtistIDs = Array.from(new Set(artistIDs)).filter(Boolean);
    if (uniqueArtistIDs.length === 0) return;

    let updated = false;

    for (const artistID of uniqueArtistIDs) {
      const artist = await ArtistModel.getArtistBySpotifyID(artistID);
      if (!artist) continue;

      const albumLinks = await AlbumModel.getAlbumsByArtistWithAffects(artistID);
      const all = albumLinks.map(link => link.album) as ReviewedAlbum[];

      if (all.length === 0) {
        await ArtistModel.deleteArtist(artistID);
        updated = true;
        continue;
      }

      const contributing = albumLinks
        .filter(link => link.affectsScore)
        .map(link => link.album) as ReviewedAlbum[];

      if (contributing.length === 0) {
        await ArtistModel.updateArtist(artistID, {
          unrated: true,
          averageScore: 0,
          bonusPoints: 0,
          totalScore: 0,
          peakScore: 0,
          latestScore: 0,
          bonusReason: JSON.stringify([]),
          reviewCount: all.length,
          leaderboardPosition: null,
          peakLeaderboardPosition: null,
          latestLeaderboardPosition: null,
        });
        updated = true;
        continue;
      }

      const {
        newAverageScore,
        newBonusPoints,
        totalScore,
        peakScore,
        latestScore,
        bonusReasons,
      } = calculateArtistScore(contributing);

      await ArtistModel.updateArtist(artistID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        peakScore,
        latestScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: all.length,
        unrated: false,
      });
      updated = true;
    }

    if (updated) {
      await ArtistService.updateAllLeaderboardPositions();
    }
  }
}
