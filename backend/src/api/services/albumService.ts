import "dotenv/config";
import { DisplayAlbum, ExtractedColor, DisplayTrack, GetPaginatedAlbumsOptions, ReviewedAlbum, ReviewedArtist, ReviewedTrack, SpotifyImage, SpotifyAlbum, RelatedGenre, PaginatedAlbumsResult, Genre } from "@shared/types";
import { ReceivedReviewData } from "@/api/controllers/albumController";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { ArtistModel } from "@/api/models/Artist";
import { fetchArtistHeaderFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { ArtistLeaderboardData, calculateLeaderboardPositions } from "@/helpers/calculateLeaderboardPositions";
import { getAllGenres } from "@/helpers/getAllGenres";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { calculateArtistScore } from "@/helpers/calculateArtistScore";
import { formatDate } from "@shared/helpers/formatDate";
import getTotalDuration from "@shared/helpers/formatDuration";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import { getImageColors } from "@/helpers/getImageColors";
import { BookmarkedAlbumModel } from "../models/BookmarkedAlbum";
import { GenreModel } from "@/api/models/Genre";

// albumService.ts (or a helpers file)
function isSpotifyAlbum(a: any): a is SpotifyAlbum {
  return typeof a === "object" && typeof a.id === "string" && Array.isArray(a.artists) && typeof a.uri === "string";
}

export class AlbumService {
  static async createAlbumReview(data: ReceivedReviewData) {
    if (!isSpotifyAlbum(data.album)) throw new Error("Invalid album data: Expected a SpotifyAlbum, received something else");

    const spotifyAlbum = data.album;
    if (await AlbumModel.findBySpotifyID(spotifyAlbum.id)) {
      throw new Error("Album already exists");
    }

    // calculate album score
    const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);

    // fetch or create artist
    let artist = await ArtistModel.getArtistBySpotifyID(spotifyAlbum.artists[0].id);
    if (!artist) {
      const fetched = await fetchArtistFromSpotify(spotifyAlbum.artists[0].id, spotifyAlbum.artists[0].href);
      let headerImage: string | null = null;
      try {
        headerImage = await fetchArtistHeaderFromSpotify(spotifyAlbum.artists[0].id);
      } catch (err) {
        console.warn("Could not fetch artist header image, skipping scraper:", err);
      }
      if (fetched) {
        const score = data.affectsArtistScore ? finalScore : 0;
        artist = await ArtistModel.createArtist({
          name: fetched.name,
          spotifyID: fetched.id,
          imageURLs: fetched.images,
          headerImage,
          averageScore: score,
          bonusPoints: 0,
          totalScore: score,
          bonusReason: JSON.stringify([]),
          reviewCount: 1,
          unrated: !data.affectsArtistScore,
          leaderboardPosition: null,
        });
      }
    }

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
      affectsArtistScore: data.affectsArtistScore,
      artistSpotifyID: artist.spotifyID,
      artistName: artist.name,
      colors: colors.map((c) => ({ hex: c.hex })),
      genres: data.genres,
    });

    const genreIDs = await Promise.all(data.genres.map((name) => GenreModel.findOrCreateGenre(name)));

    // Link new genres & bump related strengths
    await GenreModel.linkGenresToAlbum(album.spotifyID, genreIDs);
    await GenreModel.incrementRelatedStrength(genreIDs);

    // create track entries
    for (const track of data.ratedTracks) {
      const t = spotifyAlbum.tracks.items.find((i) => i.id === track.spotifyID);
      if (!t) continue;
      await TrackModel.createTrack({
        albumSpotifyID: album.spotifyID,
        artistSpotifyID: artist.spotifyID,
        artistName: artist.name,
        name: t.name,
        spotifyID: t.id,
        duration: t.duration_ms,
        features: t.artists.filter((x) => x.id !== artist.spotifyID).map((x) => ({ id: x.id, name: x.name })),
        rating: track.rating!,
      });
    }

    // Remove from bookmarks
    const isBookmarked = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
    if (isBookmarked) {
      await BookmarkedAlbumModel.removeBookmarkedAlbum(album.spotifyID);
    }

    // Get all albums for this artist
    const all = (await AlbumModel.getAlbumsByArtist(artist.spotifyID)) as ReviewedAlbum[];

    // If album contributes, handle artist update
    if (data.affectsArtistScore) {
      // If the artist is unrated, and this album is affecting their score, go thru
      // all of their previous albums with `affectsArtistScore` set to false, and set them to true
      if (artist.unrated) {
        const legacy = (await AlbumModel.getAlbumsByArtist(artist.spotifyID)) as ReviewedAlbum[];
        for (const a of legacy) {
          if (!a.affectsArtistScore) {
            await AlbumModel.updateAlbum(a.spotifyID, {
              affectsArtistScore: true,
            });
          }
        }
      }
      // Recalculate artist metrics
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(all);
      await ArtistModel.updateArtist(artist.spotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: all.length,
        unrated: false,
      });
      // update leaderboard
      const rated = (await ArtistModel.findAllArtistsSortedByTotalScore()).filter((a) => !a.unrated).map((a) => ({ id: a.id, score: a.totalScore, name: a.name }));
      const positions = calculateLeaderboardPositions(rated as ArtistLeaderboardData[]);
      let rank = 1;
      for (const r of positions) {
        await ArtistModel.updateLeaderboardPosition(r.id, rank++);
      }
    } else {
      await ArtistModel.updateArtist(artist.spotifyID, {
        reviewCount: all.length,
      });
    }

    return album;
  }

  static async getAlbumByID(id: string, includeGenres: boolean = true) {
    const album = await AlbumModel.findBySpotifyID(id);
    const artist = await ArtistModel.getArtistBySpotifyID(album.artistSpotifyID);
    const tracks = await TrackModel.getTracksByAlbumID(id);

    const displayTracks: DisplayTrack[] = tracks.map((track) => ({
      name: track.name,
      artistName: track.artistName,
      artistSpotifyID: track.artistSpotifyID,
      spotifyID: track.spotifyID,
      duration: track.duration,
      rating: track.rating,
      features: track.features,
    }));

    if (!includeGenres) {
      return { album, artist, tracks: displayTracks };
    }

    const genres = await getAllGenres();
    return { album, artist, tracks: displayTracks, genres };
  }

  static async getAllAlbums(includeCounts = false) {
    const albums = await AlbumModel.getAllAlbums();
    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      name: album.name,
      spotifyID: album.spotifyID,
      imageURLs: album.imageURLs,
      finalScore: album.finalScore,
      affectsArtistScore: album.affectsArtistScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
    }));

    if (!includeCounts) return { albums: displayAlbums };

    const numArtists = await ArtistModel.getArtistCount();
    const numAlbums = await AlbumModel.getAlbumCount();
    const numTracks = await TrackModel.getTrackCount();

    return { albums: displayAlbums, numArtists, numAlbums, numTracks };
  }

  static async getPaginatedAlbums(opts: GetPaginatedAlbumsOptions): Promise<PaginatedAlbumsResult> {
    const { albums, totalCount, furtherPages } = await AlbumModel.getPaginatedAlbums(opts);

    // const relatedGenres = opts.genres?.length ? await GenreModel.getRelatedGenres(opts.genres) : [];

    const relevantGenres = opts.genres?.length ? await GenreModel.getGenresForAlbums(albums.map((a) => a.spotifyID)) : [];

    const genres: Genre[] = await GenreModel.getAllGenres();
    genres.sort((a, b) => a.name.localeCompare(b.name));

    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      finalScore: album.finalScore,
      affectsArtistScore: album.affectsArtistScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
    }));

    console.log("genres:", genres);

    return { albums: displayAlbums, furtherPages, totalCount, genres, relatedGenres: relevantGenres };
  }

  static async deleteAlbum(id: string) {
    const album = (await AlbumModel.findBySpotifyID(id)) as ReviewedAlbum;
    if (!album) throw new Error("Album not found");

    // Remove old genres and decrement related strengths
    const oldIDs = await GenreModel.getGenreIDsForAlbum(id);
    await GenreModel.unlinkGenresFromAlbum(id, oldIDs);
    await GenreModel.decrementRelatedStrength(oldIDs);

    // Remove tracks and album
    await TrackModel.deleteTracksByAlbumID(id);
    await AlbumModel.deleteAlbum(id);

    // If it didn't affect score, stop here
    if (!album.affectsArtistScore) return;

    //  Get remaining albums
    const remaining = (await AlbumModel.getAlbumsByArtist(album.artistSpotifyID)) as ReviewedAlbum[];

    // If no albums left, drop the artist entirely
    if (remaining.length === 0) {
      await ArtistModel.deleteArtist(album.artistSpotifyID);
      return;
    }

    // Otherwise split out contributing set
    const contributing = remaining.filter((a) => a.affectsArtistScore);

    if (contributing.length === 0) {
      // No more contributing albums -> mark artist unrated & zero their score
      await ArtistModel.updateArtist(album.artistSpotifyID, {
        unrated: true,
        averageScore: 0,
        bonusPoints: 0,
        totalScore: 0,
        bonusReason: JSON.stringify([]),
        reviewCount: remaining.length,
      });
    } else {
      // Recalculate artist metrics
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(contributing);

      await ArtistModel.updateArtist(album.artistSpotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: remaining.length,
        unrated: false,
      });

      const rated = (await ArtistModel.findAllArtistsSortedByTotalScore()).filter((a) => !a.unrated).map((a) => ({ id: a.id, score: a.totalScore, name: a.name }));
      const positions = calculateLeaderboardPositions(rated as ArtistLeaderboardData[]);
      let rank = 1;
      for (const r of positions) {
        await ArtistModel.updateLeaderboardPosition(r.id, rank++);
      }
    }
  }

  static async updateAlbumReview(data: ReceivedReviewData, albumID: string) {
    const existingAlbum = (await AlbumModel.findBySpotifyID(albumID)) as ReviewedAlbum;
    if (!existingAlbum) throw new Error("Album not found");

    const artist = await ArtistModel.getArtistBySpotifyID(existingAlbum.artistSpotifyID)!;
    const wasUnrated = artist.unrated;

    // update review fields and AAS flag
    await AlbumModel.updateAlbum(albumID, {
      reviewContent: data.reviewContent,
      bestSong: data.bestSong,
      worstSong: data.worstSong,
      genres: data.genres,
      colors: data.colors,
      reviewScore: calculateAlbumScore(data.ratedTracks).baseScore,
      reviewBonuses: calculateAlbumScore(data.ratedTracks).bonuses,
      finalScore: calculateAlbumScore(data.ratedTracks).finalScore,
      affectsArtistScore: data.affectsArtistScore,
    });

    // Get new vs old genre IDs
    const oldIDs = await GenreModel.getGenreIDsForAlbum(albumID);
    const newIDs = await Promise.all(data.genres.map((name) => GenreModel.findOrCreateGenre(name)));
    const toAdd = newIDs.filter((nid) => !oldIDs.includes(nid));
    const toRemove = oldIDs.filter((oid) => !newIDs.includes(oid));

    // Add new genres and increment related strengths
    await GenreModel.linkGenresToAlbum(albumID, toAdd);
    await GenreModel.incrementRelatedStrength(toAdd);

    // Remove old genres and decrement related strengths
    await GenreModel.unlinkGenresFromAlbum(albumID, toRemove);
    await GenreModel.decrementRelatedStrength(toRemove);

    // If the artist was unrated, and this album now affects their score,
    // update their other albums that DONT affect their score.
    if (wasUnrated && data.affectsArtistScore) {
      const legacy = (await AlbumModel.getAlbumsByArtist(artist.spotifyID)) as ReviewedAlbum[];
      for (const alb of legacy) {
        if (!alb.affectsArtistScore) {
          await AlbumModel.updateAlbum(alb.spotifyID, { affectsArtistScore: true });
        }
      }
    }

    // Re-fetch all albums for this artist
    const all = (await AlbumModel.getAlbumsByArtist(existingAlbum.artistSpotifyID)) as ReviewedAlbum[];

    // Determine which are still contributing
    const contributing = all.filter((a) => a.affectsArtistScore);

    if (contributing.length === 0) {
      // No contributing albums -> mark artist unrated & zero their score
      await ArtistModel.updateArtist(existingAlbum.artistSpotifyID, {
        unrated: true,
        averageScore: 0,
        bonusPoints: 0,
        totalScore: 0,
        bonusReason: JSON.stringify([]),
        reviewCount: all.length,
      });
      await ArtistModel.updateLeaderboardPosition(artist.id, null);
    } else {
      // Recalculate artist metrics
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(contributing);

      await ArtistModel.updateArtist(existingAlbum.artistSpotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: all.length,
        unrated: false,
      });

      // Refresh leaderboard
      const rated = (await ArtistModel.findAllArtistsSortedByTotalScore()).filter((a) => !a.unrated).map((a) => ({ id: a.id, score: a.totalScore, name: a.name })) as ArtistLeaderboardData[];

      const positions = calculateLeaderboardPositions(rated);
      let rank = 1;
      for (const r of positions) {
        await ArtistModel.updateLeaderboardPosition(r.id, rank++);
      }
    }

    return AlbumModel.findBySpotifyID(albumID);
  }

  static async getReviewScoresByIds(ids: string[]) {
    return AlbumModel.getReviewScoresByIds(ids);
  }
}
