import "dotenv/config";
import { DisplayAlbum, ExtractedColor, DisplayTrack, GetPaginatedAlbumsOptions, ReviewedAlbum, ReviewedArtist, ReviewedTrack, SpotifyImage } from "@shared/types";
import { ReceivedReviewData } from "../controllers/albumController";
import { calculateAlbumScore } from "../../helpers/calculateAlbumScore";
import { calculateArtistScore } from "../../helpers/calculateArtistScore";
import formatDate from "../../helpers/formatDate";
import getTotalDuration from "../../helpers/formatDuration";
import { fetchArtistFromSpotify } from "../../helpers/fetchArtistFromSpotify";
import { getImageColors } from "../../helpers/getImageColors";
import { AlbumModel } from "../models/Album";
import { TrackModel } from "../models/Track";
import { ArtistModel } from "../models/Artist";

export class AlbumService {
  static async createAlbumReview(data: ReceivedReviewData) {
    if (!("uri" in data.album && "artists" in data.album)) {
      throw new Error("Invalid album data: Expected a SpotifyAlbum, received something else");
    }

    const existingAlbum = await AlbumModel.findBySpotifyID(data.album.id);
    if (existingAlbum) throw new Error("Album already exists");

    const roundedScore = calculateAlbumScore(data.ratedTracks);
    const artist = await ArtistModel.getArtistBySpotifyID(data.album.artists[0].id);
    let createdArtist = null;

    if (!artist) {
      const fetched = await fetchArtistFromSpotify(data.album.artists[0].id, data.album.artists[0].href);
      if (fetched) {
        createdArtist = await ArtistModel.createArtist({
          name: fetched.name,
          spotifyID: fetched.spotifyID,
          imageURLs: fetched.imageURLs,
          averageScore: roundedScore,
          leaderboardPosition: 0,
        });
      }
    }

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
      reviewScore: roundedScore,
      artistSpotifyID: createdArtist ? createdArtist.spotifyID : artist.spotifyID,
      artistName: createdArtist ? createdArtist.name : artist.name,
      colors: colors.map((c) => ({ hex: c.hex })),
      genres: data.genres,
    });

    for (const track of data.ratedTracks) {
      const t = data.album.tracks.items.find((i) => i.id === track.spotifyID);
      if (!t) continue;
      const a = createdArtist || artist;
      await TrackModel.createTrack({
        albumSpotifyID: album.spotifyID,
        artistSpotifyID: a.spotifyID,
        artistName: a.name,
        name: t.name,
        spotifyID: t.id,
        duration: t.duration_ms,
        features: t.artists.filter((x) => x.id !== a.spotifyID).map((x) => ({ id: x.id, name: x.name })),
        rating: track.rating!,
      });
    }

    if (artist) {
      const albums = await AlbumModel.getAlbumsByArtist(artist.spotifyID);
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(albums, roundedScore);
      await ArtistModel.updateArtist(artist.spotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
      });
    }

    const allArtists = await ArtistModel.findAllArtistsSortedByTotalScore();
    let rank = 1;
    for (const a of allArtists) {
      await ArtistModel.updateLeaderboardPosition(a.id, rank++);
    }

    return album;
  }

  static async getAlbumByID(id: string) {
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

    return { album, artist, tracks: displayTracks };
  }

  static async getAllAlbums(includeCounts = false) {
    const albums = await AlbumModel.getAllAlbums();
    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      name: album.name,
      spotifyID: album.spotifyID,
      imageURLs: album.imageURLs,
      reviewScore: album.reviewScore,
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
    const albums = await AlbumModel.getPaginatedAlbums(opts);
    const totalCount = await AlbumModel.getAlbumCount();
    const furtherPages = albums.length > 35;
    if (furtherPages) albums.pop();

    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      reviewScore: album.reviewScore,
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
      const newScore = calculateAlbumScore(data.ratedTracks);
      if (newScore !== existing.reviewScore) {
        updateValues.reviewScore = newScore;
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

      const newScore = calculateAlbumScore(data.ratedTracks);
      await AlbumModel.updateAlbum(albumID, { reviewScore: newScore });

      const albums = await AlbumModel.getAlbumsByArtist(existing.artistSpotifyID);
      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(albums, newScore);
      await ArtistModel.updateArtist(existing.artistSpotifyID, {
        averageScore: newAverageScore,
        bonusPoints: newBonusPoints,
        totalScore,
        bonusReason: JSON.stringify(bonusReasons),
      });
    }

    return AlbumModel.findBySpotifyID(albumID);
  }
}
