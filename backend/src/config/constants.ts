/** Number of items per page in paginated queries. */
export const PAGE_SIZE = 35;

/** Maximum possible score for an artist (capped). */
export const MAX_SCORE = 100;

/** Bonus added to artist score for each album scoring > 55. */
export const GOOD_ALBUM_BONUS = 0.25;

/** Penalty deducted from artist score for each album scoring < 45. */
export const BAD_ALBUM_BONUS = 0.25;

/** Number of Spotify IDs to fetch per batch request. */
export const SPOTIFY_CHUNK_SIZE = 50;

/** Configuration for album cover color extraction. */
export const COLOR_EXTRACTION = {
  pixels: 409600,
  distance: 0.45,
  saturationDistance: 0.3,
  lightnessDistance: 0.28,
  hueDistance: 0.12,
  nearBlackThreshold: 70,
  nearWhiteThreshold: 210,
  alphaThreshold: 250,
} as const;
