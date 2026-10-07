import type { DisplayAlbum, DisplayTrack, GetPaginatedAlbumsOptions, ReviewedAlbum, ReviewedArtist, PaginatedAlbumsResult, Genre, LinkedAlbum } from "@shared/types";
import { findLinkedAlbumIDs } from "@shared/helpers/parseReviewContent";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { ArtistModel } from "@/api/models/Artist";
import { GenreModel } from "@/api/models/Genre";
import { GenreService } from "@/api/services/GenreService";
import { AppError } from "@/api/AppError";

export class AlbumService {
  static async getAlbumByID(
    id: string,
    includeGenres: boolean = true
  ): Promise<{
    album: ReviewedAlbum;
    artists: ReviewedArtist[];
    tracks: DisplayTrack[];
    /** The reviewed albums the review text links to */
    linkedAlbums: LinkedAlbum[];
    allGenres?: Genre[];
    albumGenres?: Genre[];
  }> {
    const row = await AlbumModel.findBySpotifyID(id);
    if (!row) throw new AppError("Album not found", 404);
    const artistLinks = await AlbumModel.getAlbumArtistLinks(row.spotifyID);
    const artistIDs = artistLinks.map(link => link.artistSpotifyID);
    const artists = await ArtistModel.getArtistsBySpotifyIDs(artistIDs);
    const album: ReviewedAlbum = {
      ...row,
      artistSpotifyIDs: artistIDs,
      artistScoreIDs: artistLinks.filter(link => link.affectsScore).map(link => link.artistSpotifyID),
    };
    const tracks = await TrackModel.getTracksByAlbumID(id);

    const displayTracks: DisplayTrack[] = tracks.map(track => ({
      name: track.name,
      artistName: track.artistName,
      artistSpotifyID: track.artistSpotifyID,
      spotifyID: track.spotifyID,
      duration: track.duration,
      rating: track.rating,
      pick: track.pick,
      features: track.features,
    }));

    const linkedAlbums = await this.getLinkedAlbums(row.reviewContent);

    if (!includeGenres) {
      return { album, artists, tracks: displayTracks, linkedAlbums };
    }

    const albumGenres = await GenreService.getGenresForAlbums([album.spotifyID]);
    const allGenres = await GenreModel.getAllGenres();

    return { album, artists, tracks: displayTracks, linkedAlbums, allGenres, albumGenres };
  }

  private static async getLinkedAlbums(reviewContent: string | null): Promise<LinkedAlbum[]> {
    const albums = await AlbumModel.getAlbumsBySpotifyIDs(findLinkedAlbumIDs(reviewContent ?? ""));
    return albums.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      finalScore: album.finalScore,
      imageURLs: album.imageURLs,
    }));
  }

  static async getPaginatedAlbums(opts: GetPaginatedAlbumsOptions): Promise<PaginatedAlbumsResult> {
    const { albums, totalCount, furtherPages } = await AlbumModel.getPaginatedAlbums(opts);
    const genres = await GenreModel.getGenreCounts();

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
      colors: album.colors,
    }));

    const artistMap = await AlbumModel.getAlbumArtistIDsForAlbums(albums.map(a => a.spotifyID));
    for (const displayAlbum of displayAlbums) {
      displayAlbum.artistSpotifyIDs = artistMap.get(displayAlbum.spotifyID) ?? [];
    }

    return {
      albums: displayAlbums,
      furtherPages,
      totalCount,
      genres,
    };
  }
}
