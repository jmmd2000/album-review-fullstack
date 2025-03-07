import { ReviewedAlbum } from "../../../shared/src/types";
import { Album } from "../models/Album";
import { ReceivedReviewData } from "../controllers/albumController";

export class AlbumService {
  static async createAlbumReview(album: ReceivedReviewData) {
    return await Album.createAlbumReview(album);
  }

  static async getAlbumByID(id: string) {
    return await Album.getAlbumByID(id);
  }

  static async getAllAlbums() {
    return await Album.getAllAlbums();
  }

  static async deleteAlbum(id: string) {
    return await Album.deleteAlbum(id);
  }
}
