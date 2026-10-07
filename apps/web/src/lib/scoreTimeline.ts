export interface TimelineRelease {
  score: number;
  year: number;
}

export interface TimelinePoint {
  /** Distance from the left edge, as a percentage of the chart's width */
  x: number;
  /** Distance from the bottom edge, as a percentage of the chart's height */
  y: number;
  /** False when the release before it came out in the same year, so each year shows once */
  showYear: boolean;
}

/**
 * Places releases on the score over time chart, oldest first. The releases spread
 * evenly across the width, and the scale runs from 12 below the lowest score up to 100,
 * so the line uses the whole height. A single release sits in the middle.
 */
export function timelinePoints(releases: TimelineRelease[]): TimelinePoint[] {
  const lowest = Math.max(0, Math.min(...releases.map(release => release.score)) - 12);
  const step = releases.length > 1 ? 92 / (releases.length - 1) : 0;

  return releases.map((release, index) => ({
    x: releases.length > 1 ? 4 + index * step : 50,
    y: 6 + ((release.score - lowest) / (100 - lowest)) * 80,
    showYear: index === 0 || releases[index - 1]!.year !== release.year,
  }));
}
