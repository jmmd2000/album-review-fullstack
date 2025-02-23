import { Album } from "../models/Album";

export class AlbumService {
  static async getAlbumByID(id: string) {
    return await Album.getAlbumByID(id);
  }
}
