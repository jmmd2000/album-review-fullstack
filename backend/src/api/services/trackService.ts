import { Track } from "../models/Track";

export class TrackService {
  static async getAlbumTracks(albumID: string) {
    return await Track.getAlbumTracks(albumID);
  }

  static async deleteAlbumTracks(albumID: string) {
    await Track.deleteAlbumTracks(albumID);
  }
}
