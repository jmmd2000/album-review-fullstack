import { Artist } from "../models/Artist";

export class ArtistService {
  static async getArtists() {
    return await Artist.getArtists();
  }

  static async deleteArtist(artistID: string) {
    await Artist.deleteArtist(artistID);
  }
}
