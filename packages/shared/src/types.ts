/**
 * Recursively maps a server-side type to its JSON shape: Dates
 * become strings, everything else is walked through. Use it on the frontend
 * wherever API response data flows into a typed shape.
 */
export type Jsonified<T> = T extends Date ? string : T extends (infer U)[] ? Jsonified<U>[] : T extends object ? { [K in keyof T]: Jsonified<T[K]> } : T;

/**
 * Represents artist data attached to an album for display/selection.
 */
export interface AlbumArtist {
  /** Spotify ID of the artist. */
  spotifyID: string;
  /** Name of the artist. */
  name: string;
  /** List of artist images. */
  imageURLs: SpotifyImage[];
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
  /** The bonus set on the review, from -5 to +5, for how the album works as a whole */
  bonus: number;
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
  /** JSON string containing extracted colors from the album cover. */
  colors: ExtractedColor[];
  /** Optional array of ReviewedTracks */
  tracks?: ReviewedTrack[];
  /** String array of genres */
  genres: string[];
  /** Full album artist list (for selection/display) */
  albumArtists: AlbumArtist[];
  /** Selected album artist IDs */
  artistSpotifyIDs?: string[];
  /** Selected album artist IDs that affect score */
  artistScoreIDs?: string[];
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
  /** Position of the artist in the leaderboard, or null when the artist is unrated. */
  leaderboardPosition: number | null;
  /** Position of the artist in the peak score leaderboard. */
  peakLeaderboardPosition: number | null;
  /** Position of the artist in the latest score leaderboard. */
  latestLeaderboardPosition: number | null;
  /** List of albums associated with the artist. */
  albums?: DisplayAlbum[];
  /** The artist's score: the mean of their releases, best first, each counting 0.6 as much as the one above it. */
  totalScore: number;
  /** The score of the artist's best release. */
  peakScore: number;
  /** The mean score of the artist's latest 3 releases, weighted by rated tracks. */
  latestScore: number;
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
  /** Whether the review picks the track as one of the album's best or worst */
  pick: TrackPick | null;
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
  /** Full album artist list (for selection/display) */
  albumArtists?: AlbumArtist[];
  /** Selected album artist IDs */
  artistSpotifyIDs?: string[];
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
  /** Colours picked from the cover, for the card's hover shadow */
  colors?: ExtractedColor[];
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
  /** Position of the artist in the peak score leaderboard. */
  peakLeaderboardPosition: number | null;
  /** Position of the artist in the latest score leaderboard. */
  latestLeaderboardPosition: number | null;
  /** Current position based on sort order (calculated on frontend) */
  currentPosition?: number;
  /** Score to display based on current sort type (calculated on frontend) */
  displayScore?: number;
  /** Average review score of the artist's albums. */
  totalScore: number;
  /** Peak score calculated from top 3 highest rated albums. */
  peakScore: number;
  /** Latest score calculated from latest 3 albums. */
  latestScore: number;
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
export type TrackPick = "best" | "worst";

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
  /** Whether the review picks the track as one of the album's best or worst */
  pick?: TrackPick | null;
  /** Array of names of features */
  features: { id: string; name: string }[];
  /** Optional album images */
  imageURLs?: SpotifyImage[];
  /** The name of the track's album. Only the artist details send it. */
  albumName?: string;
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

export interface ExtractedColor {
  hex: string;
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
  /** Genre slugs to filter by. An album matches when it has any of them */
  genres?: string[];
  /** Secondary sort field (only used when orderBy is "releaseYear") */
  secondaryOrderBy?: "finalScore" | "name" | "createdAt";
  /** Secondary sort order (only used when orderBy is "releaseYear") */
  secondaryOrder?: "asc" | "desc";
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
  orderBy?: "totalScore" | "peakScore" | "latestScore" | "reviewCount" | "name" | "createdAt" | "leaderboardPosition";
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

/** A genre and how many reviewed albums have it, for the genre filter */
export interface GenreCount {
  name: string;
  slug: string;
  albumCount: number;
}

/** A scored album on the stats page */
export interface StatsAlbum {
  spotifyID: string;
  name: string;
  artistName: string;
  releaseYear: number;
  finalScore: number;
  imageURLs: SpotifyImage[];
  /** The slugs of the album's genres */
  genres: string[];
  /** The Spotify IDs of all the album's artists */
  artistSpotifyIDs: string[];
}

/** A rated artist on the stats page */
export interface StatsArtist {
  spotifyID: string;
  name: string;
  imageURLs: SpotifyImage[];
  totalScore: number;
  albumCount: number;
}

/** Everything the stats page shows. The page filters it itself. */
export interface StatsOverview {
  /** Every scored album, lowest score first */
  albums: StatsAlbum[];
  /** The rated artists */
  artists: StatsArtist[];
  /** Every genre with an album, most common first */
  genres: GenreCount[];
  /** The number of reviewed artists, rated or not */
  artistCount: number;
  ratedTrackCount: number;
}

/** A reviewed album in the home page's cover columns */
export interface HomeAlbum {
  spotifyID: string;
  name: string;
  artistName: string;
  releaseYear: number;
  finalScore: number;
  imageURLs: SpotifyImage[];
  colors: ExtractedColor[];
}

/** Everything the home page needs */
export interface HomeOverview {
  /** A random sample of reviewed albums, different on each request */
  albums: HomeAlbum[];
  /** The Spotify ID of the newest review, or null when there are none */
  latestAlbumID: string | null;
  albumCount: number;
  /** The number of reviewed artists, rated or not */
  artistCount: number;
}

/** A reviewed album in the home page's search results */
export interface HomeSearchAlbum {
  type: "album";
  spotifyID: string;
  name: string;
  artistName: string;
  releaseYear: number;
  score: number | null;
  imageURLs: SpotifyImage[];
}

/** A reviewed artist in the home page's search results */
export interface HomeSearchArtist {
  type: "artist";
  spotifyID: string;
  name: string;
  albumCount: number;
  /** Null while the artist is unrated */
  score: number | null;
  imageURLs: SpotifyImage[];
}

export type HomeSearchResult = HomeSearchAlbum | HomeSearchArtist;

export interface PaginatedAlbumsResult {
  albums: DisplayAlbum[];
  totalCount: number;
  furtherPages: boolean;
  /** Every genre with an album, most common first */
  genres: GenreCount[];
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

/**
 * The payload of each event an artist job sends over SSE, by event name.
 * The api emits these and the web reads them, so both sides use this map.
 */
export interface JobEventMap {
  /** The header scrape has started on an artist */
  fetching: Progress;
  /** The job has moved on to the next artist */
  progress: Progress;
  same: Progress;
  changed: Progress;
  failed: Progress & { message: string };
  /** The job threw and stopped early */
  fatal: { message: string };
  done: null;
}
