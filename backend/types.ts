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

export interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string | null;
    total: number;
  };
  genres: string[];
  href: string;
  id: string;
  images: {
    height: number | null;
    url: string;
    width: number | null;
  }[];
  name: string;
  popularity: number;
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
  spotifyID: string;
  name: string;
  imageURLs: string;
  leaderboardPosition: number;
  albums: DisplayAlbum[];
  averageScore: number;
  bonusPoints: number;
  bonusReason: string | null;
  totalScore: number;
  imageUpdatedAt: Date;
}

export interface DisplayAlbum {
  spotifyID: string;
  artistSpotifyID: string;
  artistName: string;
  name: string;
  releaseYear: number;
  imageURLs: SpotifyImage[];
  reviewScore?: number;
  bookmarked?: boolean;
  scoredTracks?: string;
}

export interface SpotifyImage {
  height: number;
  url: string;
  width: number;
}

export interface Reason {
  reason: string;
  value: number;
  album?: MinimalAlbum;
  concert?: Concert;
}

export interface Concert {
  id: number;
  artist: ReviewedArtist;
  artistDBID: number;
  showName: string;
  date: Date;
  city: string;
  venue: string;
  imageURL: string;
  setlist: SetlistTrack[];
  supportArtists: Array<ReviewedArtist | NonReviewedArtist>;
}

export interface SetlistTrack {
  name: string;
  encore: boolean;
  trackInfo: string;
}

export interface NonReviewedArtist {
  spotifyID: string;
  name: string;
  imageURLs: string;
}

export interface MinimalAlbum {
  id: number;
  spotifyID: string;
  name: string;
  imageURLs: SpotifyImage[];
}
