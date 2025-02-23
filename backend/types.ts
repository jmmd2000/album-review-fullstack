export interface SpotifySearchResponse {
  albums: {
    href: string;
    items: SpotifyAlbum[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

export interface SpotifyAlbum {
  album_type: string;
  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  available_markets: string[];
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: {
    height: number;
    url: string;
    width: number;
  }[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}
export interface ReviewedAlbum {
  id: number;
  artistDBID: number;
  spotifyID: string;
  artist: ReviewedArtist;
  bestSong: string;
  worstSong: string;
  name: string;
  imageURLs: string;
  createdAt: Date;
  reviewScore: number;
  reviewContent: string;
  reviewDate: string;
  runtime: string;
  releaseDate: string;
  releaseYear: number;
  scoredTracks: string;
}

export interface ReviewedArtist {
  id: number;
  spotify_id: string;
  name: string;
  image_urls: string;
  leaderboard_position: number;
  albums: DisplayAlbum[];
  average_score: number;
  bonus_points: number;
  bonus_reason: string | null;
  total_score: number;
  image_updated_at: Date;
}

export interface DisplayAlbum {
  spotify_id: string;
  artist_spotify_id: string;
  artist_name: string;
  name: string;
  release_year: number;
  image_urls: SpotifyImage[];
  review_score?: number;
  bookmarked?: boolean;
  scored_tracks?: string;
}

export interface SpotifyImage {
  height: number;
  url: string;
  width: number;
}
