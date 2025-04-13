import { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";
import { ArtistModel } from "../models/Artist";

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

  static async deleteArtist(artistID: string) {
    return ArtistModel.deleteArtist(artistID);
  }
}
