import { SCORE_DECAY, SINGLE_RELEASE_DISCOUNT } from "../constants";
import { toSortableDate } from "./formatDate";

/** A release that counts towards an artist's score */
export interface ScoredRelease {
  spotifyID: string;
  finalScore: number;
  /** The number of tracks rated above 0 */
  ratedTracks: number;
  releaseDate: string;
  releaseYear: number;
}

/** A release with its weight in the artist score */
export interface WeightedRelease<Release extends ScoredRelease> {
  release: Release;
  weight: number;
}

/** Best score first. Equal scores put the release with more rated tracks first, so the order never depends on the input order. */
function compareBestFirst(a: ScoredRelease, b: ScoredRelease): number {
  return b.finalScore - a.finalScore || b.ratedTracks - a.ratedTracks || a.spotifyID.localeCompare(b.spotifyID);
}

function compareNewestFirst(a: ScoredRelease, b: ScoredRelease): number {
  return toSortableDate(b.releaseDate, b.releaseYear).localeCompare(toSortableDate(a.releaseDate, a.releaseYear)) || a.spotifyID.localeCompare(b.spotifyID);
}

function trackWeightedMean(releases: ScoredRelease[]): number {
  const totalTracks = releases.reduce((sum, release) => sum + release.ratedTracks, 0);
  return releases.reduce((sum, release) => sum + release.finalScore * release.ratedTracks, 0) / totalTracks;
}

/**
 * Ranks an artist's releases best first and gives each its weight in the artist score:
 * its rated tracks, times SCORE_DECAY once for every release ranked above it.
 * Releases with no rated tracks are left out.
 */
export function weighReleases<Release extends ScoredRelease>(releases: Release[]): WeightedRelease<Release>[] {
  const ranked = releases.filter(release => release.ratedTracks > 0).sort(compareBestFirst);
  return ranked.map((release, rank) => ({ release, weight: release.ratedTracks * SCORE_DECAY ** rank }));
}

/**
 * Works out an artist's three scores from the releases that count towards them.
 * - Score: the weighted mean from weighReleases. With only one release, that release's score times SINGLE_RELEASE_DISCOUNT.
 * - Peak: the best release's score.
 * - Latest: the mean of the latest 3 releases, weighted by their rated tracks.
 *
 * @returns The three scores, or null when no release has a rated track, so the artist is unrated.
 */
export function calculateArtistScore(releases: ScoredRelease[]): { totalScore: number; peakScore: number; latestScore: number } | null {
  const weighted = weighReleases(releases);
  if (weighted.length === 0) return null;

  const totalWeight = weighted.reduce((sum, { weight }) => sum + weight, 0);
  const weightedMean = weighted.reduce((sum, { release, weight }) => sum + release.finalScore * weight, 0) / totalWeight;
  const best = weighted[0]!.release;
  const latest = weighted
    .map(({ release }) => release)
    .sort(compareNewestFirst)
    .slice(0, 3);

  return {
    totalScore: weighted.length === 1 ? best.finalScore * SINGLE_RELEASE_DISCOUNT : weightedMean,
    peakScore: best.finalScore,
    latestScore: trackWeightedMean(latest),
  };
}
