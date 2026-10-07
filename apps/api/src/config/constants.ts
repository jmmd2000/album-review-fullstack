/** Number of items per page in paginated queries. */
export { PAGE_SIZE } from "@shared/constants";

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
