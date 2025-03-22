import { Artist } from "../models/Artist";

export class ArtistService {
  static async getAllArtists() {
    return await Artist.getAllArtists();
  }

  static async getArtistByID(artistID: string) {
    return await Artist.getArtistByID(artistID);
  }

  static async deleteArtist(artistID: string) {
    await Artist.deleteArtist(artistID);
  }
}
