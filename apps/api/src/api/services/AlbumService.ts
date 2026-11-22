import type { DisplayAlbum, DisplayTrack, GetPaginatedAlbumsOptions, ReviewedAlbum, ReviewedArtist, PaginatedAlbumsResult, Genre, GenreCount, LinkedAlbum, RelatedAlbums } from "@shared/types";
import { findLinkedAlbumIDs } from "@shared/helpers/parseReviewContent";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { ArtistModel } from "@/api/models/Artist";
import { GenreModel } from "@/api/models/Genre";
import { GenreService } from "@/api/services/GenreService";
import { RelatedAlbumModel } from "@/api/models/RelatedAlbum";
import { closestLinkByArtist, orderSimilarAlbums, type LinkedAlbumCandidate } from "@/helpers/similarAlbums";
import { ListenerLinkModel } from "@/api/models/ListenerLink";
import { AppError } from "@/api/AppError";

const MORE_BY_ARTIST_LIMIT = 12;
const SIMILAR_LIMIT = 6;

/** The fields an album card needs */
function toDisplayAlbum(album: Omit<ReviewedAlbum, "artistSpotifyIDs" | "artistScoreIDs">): DisplayAlbum {
  return {
    spotifyID: album.spotifyID,
    name: album.name,
    imageURLs: album.imageURLs,
    finalScore: album.finalScore,
    affectsArtistScore: album.affectsArtistScore,
    artistName: album.artistName,
    artistSpotifyID: album.artistSpotifyID,
    releaseYear: album.releaseYear,
    colors: album.colors,
  };
}

export class AlbumService {
  /** The reviewed album for its page. `allGenres`, every genre with its album count for the review form, is only included when asked for. */
  static async getAlbumByID(
    id: string,
    includeAllGenres: boolean = false
  ): Promise<{
    album: ReviewedAlbum;
    artists: ReviewedArtist[];
    tracks: DisplayTrack[];
    /** The reviewed albums the review text links to */
    linkedAlbums: LinkedAlbum[];
    albumGenres: Genre[];
    allGenres?: GenreCount[];
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
    const albumGenres = await GenreService.getGenresForAlbums([album.spotifyID]);

    if (!includeAllGenres) {
      return { album, artists, tracks: displayTracks, linkedAlbums, albumGenres };
    }

    const allGenres = await GenreModel.getGenreCounts();

    return { album, artists, tracks: displayTracks, linkedAlbums, allGenres, albumGenres };
  }

  /**
   * The rows under an album's review: the main artist's other albums, and up to 6 similar albums by other artists.
   * @throws AppError 404 when the album isn't reviewed.
   */
  static async getRelatedAlbums(albumID: string): Promise<RelatedAlbums> {
    const album = await AlbumModel.findBySpotifyID(albumID);
    if (!album) throw new AppError("Album not found", 404);

    const artistIDs = await AlbumModel.getAlbumArtistIDs(albumID);
    const genreIDs = await GenreModel.getGenreIDsForAlbum(albumID);
    const [moreByArtist, linked, byGenre, genreAlbumCounts, totalAlbums] = await Promise.all([
      RelatedAlbumModel.getOtherAlbumsByArtist(album.artistSpotifyID, albumID, MORE_BY_ARTIST_LIMIT),
      this.getListenerLinkedAlbums(artistIDs),
      RelatedAlbumModel.getAlbumsSharingGenres(genreIDs, artistIDs),
      RelatedAlbumModel.getGenreAlbumCounts(genreIDs),
      AlbumModel.getAlbumCount(),
    ]);

    const similarIDs = orderSimilarAlbums({ linked, byGenre, genreAlbumCounts, totalAlbums, limit: SIMILAR_LIMIT });
    const similarAlbums = await AlbumModel.getAlbumsBySpotifyIDs(similarIDs);
    const albumsByID = new Map(similarAlbums.map(similarAlbum => [similarAlbum.spotifyID, similarAlbum]));
    const similar = similarIDs.flatMap(id => {
      const similarAlbum = albumsByID.get(id);
      return similarAlbum ? [toDisplayAlbum(similarAlbum)] : [];
    });

    return { moreByArtist: moreByArtist.map(toDisplayAlbum), similar };
  }

  /** The albums by artists that listeners link to these artists, with each album's closest link. Albums by these artists are left out. */
  private static async getListenerLinkedAlbums(artistIDs: string[]): Promise<LinkedAlbumCandidate[]> {
    const [links, reviewedArtists] = await Promise.all([ListenerLinkModel.getLinks(artistIDs), ListenerLinkModel.getAllArtists()]);
    const closestLinks = closestLinkByArtist(links, reviewedArtists);
    const rows = await RelatedAlbumModel.getAlbumsByArtists([...closestLinks.keys()], artistIDs);

    const candidates = new Map<string, LinkedAlbumCandidate>();
    for (const row of rows) {
      const position = closestLinks.get(row.artistSpotifyID) ?? Infinity;
      const existing = candidates.get(row.albumSpotifyID);
      if (!existing || position < existing.position)
        candidates.set(row.albumSpotifyID, { albumSpotifyID: row.albumSpotifyID, artistSpotifyID: row.mainArtistSpotifyID, position, finalScore: row.finalScore });
    }
    return [...candidates.values()];
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
      ...(opts.orderBy === "plays" ? { plays: album.plays ?? 0 } : {}),
      ...(opts.orderBy === "minutes" ? { minutes: album.minutes ?? 0 } : {}),
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
