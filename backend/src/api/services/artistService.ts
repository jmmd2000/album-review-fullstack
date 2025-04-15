import { DisplayArtist, GetPaginatedArtistsOptions, DisplayAlbum, DisplayTrack } from "@shared/types";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { toSortableDate } from "@/helpers/formatDate";

export class ArtistService {
  static async getAllArtists() {
    return ArtistModel.getAllArtists();
  }

  static async getPaginatedArtists(opts: GetPaginatedArtistsOptions) {
    const artists = await ArtistModel.getPaginatedArtists(opts);
    const totalArtistCount = await ArtistModel.getArtistCount();
    const furtherPages = artists.length > 35;
    if (furtherPages) artists.pop();

    const displayArtists: DisplayArtist[] = artists.map((artist) => ({
      spotifyID: artist.spotifyID,
      name: artist.name,
      imageURLs: artist.imageURLs,
      totalScore: artist.totalScore,
      albumCount: artist.reviewCount,
      leaderboardPosition: artist.leaderboardPosition,
    }));

    return { artists: displayArtists, furtherPages, totalCount: totalArtistCount };
  }

  static async getArtistByID(artistID: string) {
    return ArtistModel.getArtistBySpotifyID(artistID);
  }

  static async getArtistDetails(artistID: string) {
    const artist = await ArtistModel.getArtistBySpotifyID(artistID);
    if (!artist) {
      throw new Error("Artist not found");
    }
    const albums = await AlbumModel.getAlbumsByArtist(artistID);
    const sortedAlbums = albums.sort((a, b) => {
      const dateA = new Date(toSortableDate(a.releaseDate, a.releaseYear)).getTime();
      const dateB = new Date(toSortableDate(b.releaseDate, b.releaseYear)).getTime();
      return dateB - dateA; // descending
    });

    const tracks = await TrackModel.getTracksByArtist(artistID);
    const albumImageMap = new Map(albums.map((album) => [album.spotifyID, album.imageURLs]));

    const displayTracks: DisplayTrack[] = tracks.map((track) => ({
      spotifyID: track.spotifyID,
      artistSpotifyID: track.artistSpotifyID,
      name: track.name,
      artistName: artist.name,
      duration: track.duration,
      rating: track.rating,
      features: track.features,
      imageURLs: albumImageMap.get(track.albumSpotifyID) || [],
    }));
    return { artist, albums: sortedAlbums, tracks: displayTracks };
  }

  static async deleteArtist(artistID: string) {
    return ArtistModel.deleteArtist(artistID);
  }
}
