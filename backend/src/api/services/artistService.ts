import { ArtistModel } from "../models/Artist";

export class ArtistService {
  static async getAllArtists() {
    return ArtistModel.getAllArtists();
  }

  static async getArtistByID(artistID: string) {
    return ArtistModel.getArtistBySpotifyID(artistID);
  }

  static async deleteArtist(artistID: string) {
    return ArtistModel.deleteArtist(artistID);
  }
}
