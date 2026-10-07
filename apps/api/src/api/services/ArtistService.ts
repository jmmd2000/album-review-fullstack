import type { DisplayArtist, GetPaginatedArtistsOptions, DisplayTrack } from "@shared/types";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { toSortableDate } from "@shared/helpers/formatDate";
import { AppError } from "@/api/AppError";
import { PAGE_SIZE } from "@shared/constants";

export class ArtistService {
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
}
