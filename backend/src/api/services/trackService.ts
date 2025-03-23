import { TrackModel } from "../models/Track";

export class TrackService {
  static async getAlbumTracks(albumID: string) {
    return TrackModel.getTracksByAlbumID(albumID);
  }

  static async deleteTracksByAlbumID(albumID: string) {
    return TrackModel.deleteTracksByAlbumID(albumID);
  }
}
