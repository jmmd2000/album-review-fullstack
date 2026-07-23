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
  /** Spotify uri, the create submit sends it back to the api untouched */
  uri: string;
  /** The raw date string from spotify, the formatted one is below */
  rawReleaseDate: string;
  /** Already formatted for display, as the album row stores it */
  releaseDate: string;
  releaseYear: number;
  /** Total runtime string as the album row stores it */
  runtime: string;
  imageURLs: SpotifyImage[];
  colors: ExtractedColor[];
  artists: CapturedArtist[];
  tracks: CapturedTrack[];
}
