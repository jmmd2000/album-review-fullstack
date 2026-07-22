import type { ExtractedColor, SpotifyImage } from "@shared/types";

/** One track as snapshotted from spotify, in the shape the seeder inserts. */
export interface CapturedTrack {
  spotifyID: string;
  name: string;
  /** Duration in milliseconds */
  duration: number;
  artistName: string;
  artistSpotifyID: string;
  features: { id: string; name: string }[];
}

/** One artist as snapshotted from spotify. */
export interface CapturedArtist {
  spotifyID: string;
  name: string;
  imageURLs: SpotifyImage[];
}

/** One album as snapshotted from spotify, everything the seeder needs and nothing else. */
export interface CapturedAlbum {
  spotifyID: string;
  name: string;
  releaseYear: number;
  imageURLs: SpotifyImage[];
  colors: ExtractedColor[];
  artists: CapturedArtist[];
  tracks: CapturedTrack[];
}
