import { C } from "drizzle-kit/index-Z-1TKnbX";
import { ReviewedAlbum } from "../../../../shared/types";
import { Album } from "../models/Album";
import { ReceivedReviewData } from "../controllers/albumController";

export class AlbumService {
  static async createAlbumReview(album: ReceivedReviewData) {
    return await Album.createAlbumReview(album);
  }

  static async getAlbumByID(id: string) {
    return await Album.getAlbumByID(id);
  }
}
