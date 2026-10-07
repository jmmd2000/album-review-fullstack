import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { GenreModel } from "@/api/models/Genre";
import { TrackModel } from "@/api/models/Track";
import type { StatsAlbum, StatsArtist, StatsOverview } from "@shared/types";

export class StatsService {
  /**
   * Everything the stats page needs: every album lowest score first, with its genres and artists,
   * the rated artists, the genres with their album counts, and the artist and rated track totals.
   * The page filters these itself.
   */
  static async getOverview(): Promise<StatsOverview> {
    const sortedAlbums = (await AlbumModel.getAllAlbums()).sort((a, b) => a.finalScore - b.finalScore);
    const albumIDs = sortedAlbums.map(album => album.spotifyID);

    const [genreRows, artistIDsByAlbum, allArtists, genres, artistCount, ratedTrackCount] = await Promise.all([
      GenreModel.getGenresForAlbumsRaw(albumIDs),
      AlbumModel.getAlbumArtistIDsForAlbums(albumIDs),
      ArtistModel.getAllArtists(),
      GenreModel.getGenreCounts(),
      ArtistModel.getArtistCount(),
      TrackModel.getRatedTrackCount(),
    ]);

    const genreSlugsByAlbum = new Map<string, string[]>();
    for (const row of genreRows) {
      const slugs = genreSlugsByAlbum.get(row.album_genres.albumSpotifyID) ?? [];
      genreSlugsByAlbum.set(row.album_genres.albumSpotifyID, [...slugs, row.genres.slug]);
    }

    const albums: StatsAlbum[] = sortedAlbums.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      finalScore: album.finalScore,
      imageURLs: album.imageURLs,
      genres: genreSlugsByAlbum.get(album.spotifyID) ?? [],
      artistSpotifyIDs: artistIDsByAlbum.get(album.spotifyID) ?? [],
    }));

    const artists: StatsArtist[] = allArtists
      .filter(artist => !artist.unrated)
      .map(artist => ({
        spotifyID: artist.spotifyID,
        name: artist.name,
        imageURLs: artist.imageURLs,
        totalScore: artist.totalScore,
        albumCount: artist.reviewCount,
      }));

    return { albums, artists, genres, artistCount, ratedTrackCount };
  }
}
