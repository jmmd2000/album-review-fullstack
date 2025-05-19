import "dotenv/config";
import { DisplayAlbum, ExtractedColor, DisplayTrack, GetPaginatedAlbumsOptions, ReviewedAlbum, ReviewedArtist, ReviewedTrack, SpotifyImage } from "@shared/types";
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

export class AlbumService {
  static async createAlbumReview(data: ReceivedReviewData) {
    if (!("uri" in data.album && "artists" in data.album)) {
      throw new Error("Invalid album data: Expected a SpotifyAlbum, received something else");
    }

    const existingAlbum = await AlbumModel.findBySpotifyID(data.album.id);
    if (existingAlbum) throw new Error("Album already exists");

    const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);
    const existingArtist = await ArtistModel.getArtistBySpotifyID(data.album.artists[0].id);
    let createdArtist = null;

    if (!existingArtist) {
      const fetched = await fetchArtistFromSpotify(data.album.artists[0].id, data.album.artists[0].href);
      const headerImage = await fetchArtistHeaderFromSpotify(data.album.artists[0].id);
      if (fetched) {
        createdArtist = await ArtistModel.createArtist({
          name: fetched.name,
          spotifyID: fetched.id,
          imageURLs: fetched.images,
          headerImage: headerImage,
          averageScore: finalScore,
          leaderboardPosition: 0,
        });
      }
    }

    const finalArtist = createdArtist || existingArtist;
    if (!finalArtist) throw new Error("Failed to resolve artist.");

    const releaseDate = formatDate(data.album.release_date);
    const releaseYear = new Date(data.album.release_date).getFullYear();
    const runtime = getTotalDuration(data.album);
    const image = data.album.images[0].url;

    let colors: ExtractedColor[] = data.colors || [];
    if (!colors.length) {
      try {
        colors = await getImageColors(image);
      } catch (err) {
        console.error("Color extraction failed:", err);
      }
    }

    const album = await AlbumModel.createAlbum({
      name: data.album.name,
      spotifyID: data.album.id,
      releaseDate,
      releaseYear,
      imageURLs: data.album.images,
      bestSong: data.bestSong,
      worstSong: data.worstSong,
      runtime,
      reviewContent: data.reviewContent,
      reviewScore: baseScore,
      reviewBonuses: bonuses,
      finalScore: finalScore,
      artistSpotifyID: finalArtist.spotifyID,
      artistName: finalArtist.name,
      colors: colors.map((c) => ({ hex: c.hex })),
      genres: data.genres,
    });

    for (const track of data.ratedTracks) {
      const t = data.album.tracks.items.find((i) => i.id === track.spotifyID);
      if (!t) continue;
      await TrackModel.createTrack({
        albumSpotifyID: album.spotifyID,
        artistSpotifyID: finalArtist.spotifyID,
        artistName: finalArtist.name,
        name: t.name,
        spotifyID: t.id,
        duration: t.duration_ms,
        features: t.artists.filter((x) => x.id !== finalArtist.spotifyID).map((x) => ({ id: x.id, name: x.name })),
        rating: track.rating!,
      });
    }

    const isBookmarked = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
    if (isBookmarked) {
      await BookmarkedAlbumModel.removeBookmarkedAlbum(album.spotifyID);
    }

    const albums = (await AlbumModel.getAlbumsByArtist(finalArtist.spotifyID)) as ReviewedAlbum[];
    const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(albums);
    await ArtistModel.updateArtist(finalArtist.spotifyID, {
      averageScore: newAverageScore,
      bonusPoints: newBonusPoints,
      totalScore,
      bonusReason: JSON.stringify(bonusReasons),
      reviewCount: albums.length,
    });

    const allArtists = await ArtistModel.findAllArtistsSortedByTotalScore();
    const mappedArtists = allArtists.map((a) => ({
      id: a.id,
      score: a.totalScore,
      name: a.name,
    })) as ArtistLeaderboardData[];

    const leaderboardPositions = calculateLeaderboardPositions(mappedArtists);
    let rank = 1;
    for (const artist of leaderboardPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, rank++);
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

  static async getPaginatedAlbums(opts: GetPaginatedAlbumsOptions) {
    const { albums, totalCount, furtherPages } = await AlbumModel.getPaginatedAlbums(opts);

    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      finalScore: album.finalScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
    }));

    return { albums: displayAlbums, furtherPages, totalCount };
  }

  static async deleteAlbum(id: string) {
    const album = await AlbumModel.findBySpotifyID(id);
    if (!album) throw new Error("Album not found");

    await TrackModel.deleteTracksByAlbumID(id);
    await AlbumModel.deleteAlbum(id);

    const albums = (await AlbumModel.getAlbumsByArtist(album.artistSpotifyID)) as ReviewedAlbum[];
    if (albums.length === 0) {
      await ArtistModel.deleteArtist(album.artistSpotifyID);
    } else {
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(albums);
      await ArtistModel.updateArtist(album.artistSpotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: albums.length,
      });
    }

    const allArtists = await ArtistModel.findAllArtistsSortedByTotalScore();
    const mappedArtists = allArtists.map((a) => ({
      id: a.id,
      score: a.totalScore,
      name: a.name,
    })) as ArtistLeaderboardData[];

    const leaderboardPositions = calculateLeaderboardPositions(mappedArtists);
    let rank = 1;
    for (const artist of leaderboardPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, rank++);
    }
  }

  static async updateAlbumReview(data: ReceivedReviewData, albumID: string) {
    if (!("reviewScore" in data.album && "artistName" in data.album)) {
      throw new Error("Invalid album data: Expected a ReviewedAlbum, received something else");
    }

    const existing = await AlbumModel.findBySpotifyID(albumID);
    if (!existing) throw new Error("Album not found");

    const existingTracks = await TrackModel.getTracksByAlbumID(albumID);
    let updateValues: Partial<typeof existing> = {};
    let updateNeeded = false;

    if (data.reviewContent !== existing.reviewContent) {
      updateValues.reviewContent = data.reviewContent;
      updateNeeded = true;
    }
    if (data.bestSong !== existing.bestSong) {
      updateValues.bestSong = data.bestSong;
      updateNeeded = true;
    }
    if (data.worstSong !== existing.worstSong) {
      updateValues.worstSong = data.worstSong;
      updateNeeded = true;
    }
    if (JSON.stringify(data.genres) !== JSON.stringify(existing.genres)) {
      updateValues.genres = data.genres;
      updateNeeded = true;
    }
    if (JSON.stringify(data.colors) !== JSON.stringify(existing.colors)) {
      updateValues.colors = data.colors;
      updateNeeded = true;
    }

    const tracksChanged = data.ratedTracks.some((newTrack) => {
      const old = existingTracks.find((t) => t.spotifyID === newTrack.spotifyID);
      return !old || old.rating !== newTrack.rating;
    });

    if (tracksChanged) {
      const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);
      if (baseScore !== existing.reviewScore) {
        updateValues.reviewScore = baseScore;
        updateNeeded = true;
      }
    }

    if (updateNeeded) await AlbumModel.updateAlbum(albumID, updateValues);

    if (tracksChanged) {
      for (const newTrack of data.ratedTracks) {
        const existingTrack = existingTracks.find((t) => t.spotifyID === newTrack.spotifyID);
        if (!existingTrack) {
          await TrackModel.createTrack({
            albumSpotifyID: albumID,
            artistSpotifyID: existing.artistSpotifyID,
            artistName: existing.artistName,
            name: newTrack.name,
            spotifyID: newTrack.spotifyID,
            duration: newTrack.duration,
            features: newTrack.features,
            rating: newTrack.rating ?? 0,
          });
        } else if (existingTrack.rating !== newTrack.rating) {
          if (newTrack.rating !== undefined) {
            await TrackModel.updateTrackRating(newTrack.spotifyID, newTrack.rating);
          }
        }
      }

      const { baseScore, bonuses, finalScore } = calculateAlbumScore(data.ratedTracks);
      await AlbumModel.updateAlbum(albumID, { reviewScore: baseScore, reviewBonuses: bonuses, finalScore: finalScore });

      const albums = (await AlbumModel.getAlbumsByArtist(existing.artistSpotifyID)) as ReviewedAlbum[];
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(albums);
      await ArtistModel.updateArtist(existing.artistSpotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
        reviewCount: albums.length,
      });
    }

    const allArtists = await ArtistModel.findAllArtistsSortedByTotalScore();
    const mappedArtists = allArtists.map((a) => ({
      id: a.id,
      score: a.totalScore,
      name: a.name,
    })) as ArtistLeaderboardData[];

    const leaderboardPositions = calculateLeaderboardPositions(mappedArtists);
    let rank = 1;
    for (const artist of leaderboardPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, rank++);
    }

    return AlbumModel.findBySpotifyID(albumID);
  }

  static async getReviewScoresByIds(ids: string[]) {
    return AlbumModel.getReviewScoresByIds(ids);
  }
}
