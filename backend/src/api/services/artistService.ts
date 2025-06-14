import { DisplayArtist, GetPaginatedArtistsOptions, DisplayAlbum, DisplayTrack, SpotifyImage } from "@shared/types";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { toSortableDate } from "@shared/helpers/formatDate";
import { fetchArtistHeaderFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";

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
      unrated: artist.unrated,
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

  static async updateArtistHeaders(all: boolean, spotifyID?: string): Promise<void> {
    let ids: string[];
    if (all) {
      const artists = await ArtistModel.getAllArtists();
      ids = artists.map((a) => a.spotifyID);
    } else if (spotifyID) {
      ids = [spotifyID];
    } else {
      throw new Error("Must specify either all=true or a spotifyID");
    }

    for (const id of ids) {
      try {
        const header = await fetchArtistHeaderFromSpotify(id);
        if (header) {
          console.log("updating artist1", id);
          await ArtistModel.updateArtist(id, {
            headerImage: header,
            imageUpdatedAt: new Date(),
          });
        }
      } catch (err) {
        console.error(`Header update failed for ${id}:`, err);
      }
    }
  }

  static async updateArtistImages(all: boolean, spotifyID?: string): Promise<void> {
    console.log("Updating artist images in service");
    let ids: string[];
    if (all) {
      const artists = await ArtistModel.getAllArtists();
      ids = artists.map((a) => a.spotifyID);
    } else if (spotifyID) {
      ids = [spotifyID];
    } else {
      throw new Error("Must specify either all=true or a spotifyID");
    }

    for (const id of ids) {
      try {
        const url = `https://api.spotify.com/v1/artists/${id}`;
        const artist = await fetchArtistFromSpotify(id, url);
        if (artist) {
          console.log("updating artist2", artist.name);
          await ArtistModel.updateArtist(id, {
            imageURLs: artist.images as SpotifyImage[],
            imageUpdatedAt: new Date(),
          });
        }
      } catch (err) {
        console.error(`Image update failed for ${id}:`, err);
      }
    }
  }
}
