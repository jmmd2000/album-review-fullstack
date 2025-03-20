/**
 * Represents a Spotify album search response.
 */
export interface SpotifySearchResponse {
  /**Contains the album search results.*/
  albums: {
    /** API endpoint for this search result. */
    href: string;
    /** List of albums returned. */
    items: SpotifyAlbum[];
    /** Number of albums per request. */
    limit: number;
    /** URL for the next page, or `null` if none. */
    next: string | null;
    /** Index of the first album in the current page. */
    offset: number;
    /** URL for the previous page, or `null` if first page. */
    previous: string | null;
    /** Total number of albums found. */
    total: number;
  };
}

/**
 * Represents an album from the Spotify API.
 */
export interface SpotifyAlbum {
  /** Type of the album (e.g., "album", "single"). */
  album_type: string;
  /** List of artists associated with the album. */
  artists: {
    /** External URLs for the artist (e.g., Spotify link). */
    external_urls: { spotify: string };
    /** API endpoint for the artist. */
    href: string;
    /** Unique Spotify ID of the artist. */
    id: string;
    /** Name of the artist. */
    name: string;
    /** Type of entity (e.g., "artist"). */
    type: string;
    /** Spotify URI for the artist. */
    uri: string;
  }[];
  /** List of country codes where the album is available. */
  available_markets: string[];
  /** External URLs for the album (e.g., Spotify link). */
  external_urls: { spotify: string };
  /** API endpoint for the album. */
  href: string;
  /** Unique Spotify ID of the album. */
  id: string;
  /** List of album cover images in different sizes. */
  images: {
    /** Image height in pixels. */
    height: number;
    /** URL of the image. */
    url: string;
    /** Image width in pixels. */
    width: number;
  }[];
  /** Album name. */
  name: string;
  /** Release date of the album (YYYY-MM-DD or YYYY). */
  release_date: string;
  /** Precision of the release date ("year", "month", or "day"). */
  release_date_precision: string;
  /** Total number of tracks in the album. */
  total_tracks: number;
  /** Type of entity (always "album"). */
  type: string;
  /** Spotify URI for the album. */
  uri: string;
  /** List of tracks in the album. */
  tracks: { items: SpotifyTrack[] };
  /** The extracted colours from the album cover */
  colors: ExtractedColor[];
}

/**
 * Represents a track from the Spotify API.
 */
export interface SpotifyTrack {
  /** List of artists featured on the track. */
  artists: {
    /** External URLs for the artist (e.g., Spotify link). */
    external_urls: { spotify: string };
    /** API endpoint for the artist. */
    href: string;
    /** Unique Spotify ID of the artist. */
    id: string;
    /** Name of the artist. */
    name: string;
    /** Type of entity (always "artist"). */
    type: string;
    /** Spotify URI for the artist. */
    uri: string;
  }[];
  /** List of country codes where the track is available. */
  available_markets: string[];
  /** The disc number the track is on (1 for single-disc albums). */
  disc_number: number;
  /** Duration of the track in milliseconds. */
  duration_ms: number;
  /** Whether the track contains explicit content. */
  explicit: boolean;
  /** External URLs for the track (e.g., Spotify link). */
  external_urls: { spotify: string };
  /** API endpoint for the track. */
  href: string;
  /** Unique Spotify ID of the track. */
  id: string;
  /** Whether the track is a local file. */
  is_local: boolean;
  /** Name of the track. */
  name: string;
  /** URL for a 30-second preview of the track. */
  preview_url: string;
  /** Track position within the album. */
  track_number: number;
  /** Type of entity (always "track"). */
  type: string;
  /** Spotify URI for the track. */
  uri: string;
}

/**
 * Represents an artist from the Spotify API.
 */
export interface SpotifyArtist {
  /** External URLs for the artist (e.g., Spotify link). */
  external_urls: { spotify: string };
  /** Artist's follower details. */
  followers: {
    /** API endpoint for retrieving followers (always `null`). */
    href: string | null;
    /** Total number of followers. */
    total: number;
  };
  /** List of genres associated with the artist. */
  genres: string[];
  /** API endpoint for the artist. */
  href: string;
  /** Unique Spotify ID of the artist. */
  id: string;
  /** List of images of the artist in different sizes. */
  images: SpotifyImage[];
  /** Name of the artist. */
  name: string;
  /** Popularity score (0-100, based on Spotify metrics). */
  popularity: number;
  /** Type of entity (always "artist"). */
  type: string;
  /** Spotify URI for the artist. */
  uri: string;
}

/**
 * Represents a reviewed album.
 */
export interface ReviewedAlbum {
  /** Unique ID of the reviewed album. */
  id: number;
  /** Spotify ID of the associated artist. */
  artistSpotifyID: string;
  /** Artist name */
  artistName: string;
  /** Spotify ID of the album. */
  spotifyID: string;
  // /** The artist who created the album. */
  // artist: ReviewedArtist;
  /** The best song from the album as chosen in the review. */
  bestSong: string;
  /** The worst song from the album as chosen in the review. */
  worstSong: string;
  /** The album's name. */
  name: string;
  /** JSON string containing album image URLs. */
  imageURLs: SpotifyImage[];
  /** Timestamp when the review was created. */
  createdAt: Date;
  /** The numerical review score given to the album. */
  reviewScore: number;
  /** Full content of the album review. */
  reviewContent: string | null;
  /** Runtime duration of the album. */
  runtime: string;
  /** Official release date of the album. */
  releaseDate: string;
  /** Release year of the album. */
  releaseYear: number;
  /** JSON string containing track ratings in the form { `id:string;` `rating:number` } */
  // scoredTracks: string;
  /** JSON string containing extracted colors from the album cover. */
  colors: ExtractedColor[];
  /** Optional array of ReviewedTracks */
  tracks?: ReviewedTrack[];
  /** String array of genres */
  genres: string[];
}

/**
 * Represents a reviewed artist.
 */
export interface ReviewedArtist {
  /** Unique ID of the reviewed artist. */
  id: number;
  /** Spotify ID of the artist. */
  spotifyID: string;
  /** Name of the artist. */
  name: string;
  /** JSON string containing artist image URLs. */
  imageURLs: SpotifyImage[];
  /** Position of the artist in the leaderboard. */
  leaderboardPosition: number;
  /** List of albums associated with the artist. */
  albums?: DisplayAlbum[];
  /** Average review score of the artist's albums. */
  averageScore: number;
  /** Bonus points awarded to the artist. */
  bonusPoints: number;
  /** Reason for bonus points, if applicable. */
  bonusReason: string | null;
  /** Total calculated score of the artist. */
  totalScore: number;
  /** Timestamp of the last image update. */
  imageUpdatedAt: Date;
}

/**
 * Represents a reviewed track.
 */
export interface ReviewedTrack {
  /** Unique ID of the reviewed track. */
  id: number;
  /** Spotify ID of the associated artist. */
  artistSpotifyID: string;
  /** Name of the artist. */
  artistName: string;
  /** Spotify ID of the associated album. */
  albumSpotifyID: string;
  /** Name of the track. */
  name: string;
  /** Spotify ID of the track. */
  spotifyID: string;
  /** Array of names of features in the form {id:string; name:string} */
  features: { id: string; name: string }[];
  /** Duration of the track in milliseconds. */
  duration: number;
  /** Rating of the track. */
  rating?: number;
}

/**
 * Represents the minimum data needed to display the above 3 types on an `AlbumCard`
 */
export interface DisplayAlbum {
  /** Spotify ID of the album. */
  spotifyID: string;
  /** Spotify ID of the artist. */
  artistSpotifyID: string;
  /** Name of the artist. */
  artistName: string;
  /** Name of the album. */
  name: string;
  /** Year the album was released. */
  releaseYear: number;
  /** List of album cover images. */
  imageURLs: SpotifyImage[];
  /** Optional review score given to the album. */
  reviewScore?: number;
  /** Indicates whether the album is bookmarked. */
  bookmarked?: boolean;
  /** Optional JSON string containing scored track details. */
  scoredTracks?: string;
}

/**
 * Represents the minimum data needed to display a track on a `TrackCard`.
 */
export interface DisplayTrack {
  /** Spotify ID of the track. */
  spotifyID: string;
  /** Spotify ID of the artist. */
  artistSpotifyID: string;
  /** Name of the artist. */
  artistName: string;
  /** Name of the track. */
  name: string;
  /** Duration of the track in milliseconds. */
  duration: number;
  /** Optional rating of the track. */
  rating?: number;
  /** Array of names of features */
  features: { id: string; name: string }[];
}

/**
 * Represents an image from Spotify.
 */
export interface SpotifyImage {
  /** Image height in pixels. */
  height: number;
  /** URL of the image. */
  url: string;
  /** Image width in pixels. */
  width: number;
}

/**
 * Represents a reason for a bonus point.
 */
export interface Reason {
  /** Description of the reason. */
  reason: string;
  /** Numerical value of the bonus. */
  value: number;
  /** Optional album associated with the reason. */
  album?: MinimalAlbum;
  /** Optional concert associated with the reason. */
  concert?: Concert;
}

/**
 * Represents a concert performance.
 */
export interface Concert {
  /** Unique ID of the concert. */
  id: number;
  /** The artist who performed at the concert. */
  artist: ReviewedArtist;
  /** Spotify ID of the associated artist. */
  artistSpotifyID: number;
  /** Name of the concert or tour. */
  showName: string;
  /** Date of the concert. */
  date: Date;
  /** City where the concert took place. */
  city: string;
  /** Venue where the concert was held. */
  venue: string;
  /** URL of the concert image or poster. */
  imageURL: string;
  /** List of tracks played at the concert. */
  setlist: SetlistTrack[];
  /** List of supporting artists, reviewed or non-reviewed. */
  supportArtists: Array<ReviewedArtist | NonReviewedArtist>;
}

/**
 * Represents a track played in a concert setlist.
 */
export interface SetlistTrack {
  /** Name of the track. */
  name: string;
  /** Whether the track was played as an encore. */
  encore: boolean;
  /** Additional information about the track. */
  trackInfo: string;
}

/**
 * Represents an artist who has not been reviewed.
 */
export interface NonReviewedArtist {
  /** Spotify ID of the artist. */
  spotifyID: string;
  /** Name of the artist. */
  name: string;
  /** JSON string containing artist image URLs. */
  imageURLs: SpotifyImage[];
}

/**
 * Represents bare minimum data for an album
 */
export interface MinimalAlbum {
  /** Unique ID of the album. */
  id: number;
  /** Spotify ID of the album. */
  spotifyID: string;
  /** Name of the album. */
  name: string;
  /** List of album cover images. */
  imageURLs: SpotifyImage[];
}

export interface ExtractedColor {
  // area: number;
  // blue: number;
  // green: number;
  // red: number;
  hex: string;
  // hue: number;
  // lightness: number;
  // saturation: number;
  // intensity: number;
}
