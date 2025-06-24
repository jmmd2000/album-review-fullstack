import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { DisplayAlbum, DisplayArtist, Genre, RelatedGenre } from "@shared/types";
import { GenreModel } from "@/api/models/Genre";
import { calculateFavouriteGenres } from "@/helpers/calculateFavouriteGenres";
import { AlbumGenreModel } from "@/api/models/AlbumGenre";
import { ratingTiers } from "@shared/helpers/ratingTiers";
import { TrackModel } from "../models/Track";

export class StatsService {
  static async getFavourites(): Promise<{
    leastFavouriteGenre: Genre | null;
    favouriteGenre: Genre | null;
    leastFavouriteAlbum: DisplayAlbum | null;
    favouriteAlbum: DisplayAlbum | null;
    leastFavouriteArtist: DisplayArtist | null;
    favouriteArtist: DisplayArtist | null;
  }> {
    // Fetch fav / least fav album
    const albums = await AlbumModel.getAllAlbums();
    const filteredSortedAlbums = albums.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
    const favouriteAlbum = filteredSortedAlbums[0] ?? null;
    const leastFavouriteAlbum = filteredSortedAlbums[filteredSortedAlbums.length - 1] ?? null;

    // Fetch fav / least fav artists
    const artists = await ArtistModel.getAllArtists();
    const displayArtists: DisplayArtist[] = artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      totalScore: artist.totalScore,
      unrated: artist.unrated,
      leaderboardPosition: artist.leaderboardPosition,
      albumCount: artist.reviewCount,
      spotifyID: artist.spotifyID,
      imageURLs: artist.imageURLs,
    }));
    const filteredSortedArtists = displayArtists.filter((a) => (a.totalScore ?? 0) !== 0).sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    const favouriteArtist = filteredSortedArtists[0] ?? null;
    const leastFavouriteArtist = filteredSortedArtists[filteredSortedArtists.length - 1] ?? null;

    // Fetch fav / least fav genre
    const genres = await GenreModel.getAllGenres();
    const albumGenres = await AlbumGenreModel.getAllAlbumGenres();
    const { favouriteGenre, leastFavouriteGenre } = calculateFavouriteGenres(albums, genres, albumGenres);

    return {
      favouriteArtist,
      leastFavouriteArtist,
      favouriteAlbum,
      leastFavouriteAlbum,
      favouriteGenre,
      leastFavouriteGenre,
    };
  }

  static async getGenreStats(slug: string | undefined): Promise<{
    reviewedAlbumCount: number | null;
    averageScore: number | null;
    relatedGenres: Genre[] | null;
    albums: {
      highestRated: DisplayAlbum;
      lowestRated: DisplayAlbum;
    } | null;
    name: string | null;
    slug: string | null;
    allGenres: Genre[];
  }> {
    const allGenres = await GenreModel.getAllGenres();
    if (!slug) {
      return {
        reviewedAlbumCount: null,
        averageScore: null,
        relatedGenres: null,
        albums: null,
        name: null,
        slug: null,
        allGenres: allGenres,
      };
    }
    const relatedGenres = await GenreModel.getRelatedGenres([slug]);
    const albumsWithGenre = await GenreModel.getAlbumsByGenre(slug);
    const reviewedAlbumCount = albumsWithGenre.length;
    let averageScore = reviewedAlbumCount > 0 ? albumsWithGenre.reduce((sum, album) => sum + (album.finalScore ?? 0), 0) / reviewedAlbumCount : 0;
    // Round to 2 decimal places
    averageScore = Math.round(averageScore * 100) / 100;

    const genre = await GenreModel.findBySlug(slug);

    return {
      reviewedAlbumCount,
      averageScore,
      relatedGenres,
      albums: {
        highestRated: albumsWithGenre[0],
        lowestRated: albumsWithGenre[albumsWithGenre.length - 1],
      },
      name: genre?.name ?? "Unknown Genre",
      slug: genre?.slug ?? "unknown-genre",
      allGenres: allGenres,
    };
  }

  static async getRatingDistribution(): Promise<{ rating: string; count: number }[]> {
    const albums = await AlbumModel.getAllAlbums();
    const distribution: { [key: string]: number } = {};

    // Initialize all tiers with 0
    for (const tier of ratingTiers) {
      distribution[tier.label] = 0;
    }

    for (const album of albums) {
      if (album.finalScore !== null && album.finalScore !== undefined) {
        const tier = ratingTiers.find((t) => t.range[0] <= album.finalScore && t.range[1] >= album.finalScore);
        if (tier) {
          distribution[tier.label] += 1;
        }
      }
    }

    return ratingTiers.map((tier) => ({
      rating: tier.label,
      count: distribution[tier.label] || 0,
    }));
  }

  static async getResourceCounts(): Promise<{
    albumCount: number;
    artistCount: number;
    genreCount: number;
    trackCount: number;
  }> {
    const [albumCount, artistCount, genreCount, trackCount] = await Promise.all([AlbumModel.getAlbumCount(), ArtistModel.getArtistCount(), GenreModel.getGenreCount(), TrackModel.getTrackCount()]);

    return {
      albumCount,
      artistCount,
      genreCount,
      trackCount,
    };
  }
}
