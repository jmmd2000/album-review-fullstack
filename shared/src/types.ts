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
  artists: SimpleSpotifyArtist[];
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

/** Represents the artist data that comes with a Spotify album */
export interface SimpleSpotifyArtist {
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
  /** Timestamp when the review was last updated. */
  updatedAt: Date;
  /** The numerical review score given to the album via my ratings */
  reviewScore: number;
  /** The bonus points awarded */
  reviewBonuses: ReviewBonuses | null;
  /** The final calculated score */
  finalScore: number;
  /** Whether or not the album will affect it's artists score */
  affectsArtistScore: boolean;
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
  /** Header image scraped from spotify artist page */
  headerImage: string | null;
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
  /** Number of albums reviewed by the artist. */
  reviewCount: number;
  /** Whether or not the artist will receive a score */
  unrated: boolean;
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
  finalScore: number | null;
  /** Whether or not the album will affect it's artists score */
  affectsArtistScore: boolean;
  /** Indicates whether the album is bookmarked. */
  bookmarked?: boolean;
  /** Optional JSON string containing scored track details. */
  scoredTracks?: string;
}

/**
 * Represents the minimum data needed to display an artist on an `ArtistCard`.
 */
export interface DisplayArtist {
  /** Spotify ID of the artist. */
  spotifyID: string;
  /** Name of the artist. */
  name: string;
  /** Position of the artist in the leaderboard. */
  leaderboardPosition: number | null;
  /** Average review score of the artist's albums. */
  totalScore: number;
  /** Whether or not the artist is unrated */
  unrated: boolean;
  /** JSON string containing artist image URLs. */
  imageURLs: SpotifyImage[];
  /** Number of albums reviewed */
  albumCount: number;
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
  /** Optional album images */
  imageURLs?: SpotifyImage[];
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

/**
 * Represents the parameters passed to the getPaginatedAlbums method.
 */
export interface GetPaginatedAlbumsOptions {
  /** The page number to retrieve. */
  page?: number;
  /** The data to order the results by */
  orderBy?: "finalScore" | "releaseYear" | "name" | "createdAt";
  /** The order in which to sort the results */
  order?: "asc" | "desc";
  /** The search query to filter the results by */
  search?: string;
  /** The genre to filter the results by */
  genres?: string[];
  /** Secondary sort field (only used when orderBy is "releaseYear") */
  secondaryOrderBy?: "finalScore" | "name" | "createdAt";
  /** Secondary sort order (only used when orderBy is "releaseYear") */
  secondaryOrder?: "asc" | "desc";
}

/**
 * Represents the parameters passed to the GetStatsOptions method.
 */
export interface GetStatsOptions {
  /** The  genre slug to fetch data for. */
  slug?: string;
  /** The resource to display distribution data for */
  resource?: "albums" | "tracks" | "artists";
}

/**
 * Represents the parameters passed to the GetPaginatedBookmarkedAlbumsOptions method.
 */
export interface GetPaginatedBookmarkedAlbumsOptions {
  /** The page number to retrieve. */
  page?: number;
  /** The data to order the results by */
  orderBy?: "artistName" | "releaseYear" | "name" | "createdAt";
  /** The order in which to sort the results */
  order?: "asc" | "desc";
  /** The search query to filter the results by */
  search?: string;
}

/**
 * Represents the parameters passed to the getPaginatedArtists method.
 */
export interface GetPaginatedArtistsOptions {
  /** The page number to retrieve. */
  page?: number;
  /** The data to order the results by */
  orderBy?:
    | "totalScore"
    | "reviewCount"
    | "name"
    | "createdAt"
    | "leaderboardPosition";
  /** The order in which to sort the results */
  order?: "asc" | "desc";
  /** The search query to filter the results by */
  search?: string;
}

/**
 * Represents the parameters passed when searching for albums.
 */
export interface SearchAlbumsOptions {
  /** The search query */
  query?: string;
}

export type AuthContextType = {
  isAdmin: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export interface ReviewBonuses {
  /** Rewards albums with perfect rated tracks (max 1.5) */
  perfectBonus: number;
  /** Rewards albums with high quality tracks, 8/9 (max 1.5) */
  qualityBonus: number;
  /** Rewards albums with consistent track quality (max 1) */
  consistencyBonus: number;
  /** Rewards albums with no low rated tracks, < 5 (max 1) */
  noWeakBonus: number;
  /** Penalizes albums with terrible rated tracks, 1/10 (max -3) */
  terriblePenalty: number;
  /** Penalizes albums with poor quality tracks, 2-3/10 (max -2) */
  poorQualityPenalty: number;
  /** Penalizes albums with no tracks rated above 5/10 (fixed -2) */
  noStrongPenalty: number;
  /** Sum of all bonuses and penalties (capped between -5 and +5) */
  totalBonus: number;
}

export interface Genre {
  /** Unique ID of the genre */
  id: number;
  /** Name of the genre */
  name: string;
  /** URL-safe unique slug */
  slug: string;
  /** When the row was first inserted */
  createdAt: Date;
  /** When the row was last updated */
  updatedAt: Date;
}

/** Junction table linking albums and genres */
export interface AlbumGenre {
  /** Spotify ID of the album */
  albumSpotifyID: string;
  /** Genre ID (FK into genres.id) */
  genreID: number;
}

/** Co-occurrence weights for pairs of genres */
export interface RelatedGenre {
  /** The first genre in the pair (always =< relatedGenreID) */
  genreID: number;
  /** The second genre in the pair */
  relatedGenreID: number;
  /** How often those two have appeared together */
  strength: number;
  /** When this relationship was created */
  createdAt: Date;
  /** When this strength was last updated */
  updatedAt: Date;
}

export interface PaginatedAlbumsResult {
  albums: DisplayAlbum[];
  totalCount: number;
  furtherPages: boolean;
  /** All genres */
  genres: Genre[];
  /** All the genres that are related */
  relatedGenres?: Genre[];
}

/** Represents the progress of settings operations */
export type Progress = {
  index: number;
  total: number;
  spotifyID: string;
  artistName: string;
  artistImage?: string;
  newArtistImage?: string;
  headerImage?: string;
  newHeaderImage?: string;
};
