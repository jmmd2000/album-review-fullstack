import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import type { ArtistLeaderboardData } from "@/helpers/calculateLeaderboardPositions";
import { calculateLeaderboardPositions } from "@/helpers/calculateLeaderboardPositions";
import { calculateArtistScore } from "@shared/helpers/calculateArtistScore";
import type { ScoredRelease } from "@shared/helpers/calculateArtistScore";
import { db, type Executor } from "@/db/client";

/** The score fields saved on an artist after their albums are scored */
export interface ArtistScoreFields {
  totalScore: number;
  peakScore: number;
  latestScore: number;
  unrated: boolean;
  reviewCount: number;
  leaderboardPosition?: null;
  peakLeaderboardPosition?: null;
  latestLeaderboardPosition?: null;
}

const UNRATED_FIELDS = {
  totalScore: 0,
  peakScore: 0,
  latestScore: 0,
  unrated: true,
  leaderboardPosition: null,
  peakLeaderboardPosition: null,
  latestLeaderboardPosition: null,
} as const;

/** The artist fields the recalculation reports changes to */
const CHANGE_FIELDS = ["totalScore", "peakScore", "latestScore", "reviewCount", "unrated", "leaderboardPosition", "peakLeaderboardPosition", "latestLeaderboardPosition"] as const;

interface ScoreChange {
  field: (typeof CHANGE_FIELDS)[number];
  before: number | null;
  after: number | null;
}

function toChangeValue(value: number | boolean | null): number | null {
  return typeof value === "boolean" ? Number(value) : value;
}

/** Scores are stored as 4-byte reals, so a tiny difference isn't a change */
function hasChanged(before: number | null, after: number | null): boolean {
  if (before === null || after === null) return before !== after;
  return Math.abs(before - after) > 0.0001;
}

/** Works out and saves artist scores and leaderboard positions. */
export class ArtistScoreService {
  /**
   * Works out each artist's scores from the albums that count towards them, ready to save.
   * An artist with no counting album is unrated, with zero scores and no leaderboard positions.
   * @returns The new score fields for each artist that has at least one album. Artists with no albums are left out.
   */
  static async calculateScores(artistIDs: string[], executor: Executor = db): Promise<Map<string, ArtistScoreFields>> {
    const albumLinks = await AlbumModel.getAlbumsByArtistsWithAffects(artistIDs, executor);
    const albumIDs = [...new Set([...albumLinks.values()].flat().map(link => link.album.spotifyID))];
    const ratedTrackCounts = await TrackModel.getRatedTrackCounts(albumIDs, executor);

    const scores = new Map<string, ArtistScoreFields>();
    for (const [artistID, links] of albumLinks) {
      const releases: ScoredRelease[] = links
        .filter(link => link.affectsScore)
        .map(({ album }) => ({
          spotifyID: album.spotifyID,
          finalScore: album.finalScore,
          ratedTracks: ratedTrackCounts.get(album.spotifyID) ?? 0,
          releaseDate: album.releaseDate,
          releaseYear: album.releaseYear,
        }));
      const artistScore = calculateArtistScore(releases);

      scores.set(artistID, artistScore ? { ...artistScore, unrated: false, reviewCount: links.length } : { ...UNRATED_FIELDS, reviewCount: links.length });
    }
    return scores;
  }

  /**
   * Recalculates the scores of all artists from their albums. It saves only the scores that change,
   * then updates the leaderboard positions.
   * @returns Every artist whose scores or positions changed, with each change.
   */
  static async recalculateAllArtistScores() {
    const artists = await ArtistModel.getAllArtists();

    await db.transaction(async tx => {
      const scores = await ArtistScoreService.calculateScores(
        artists.map(artist => artist.spotifyID),
        tx
      );

      for (const artist of artists) {
        const fields = scores.get(artist.spotifyID) ?? { ...UNRATED_FIELDS, reviewCount: 0 };
        const changed = (Object.keys(fields) as (keyof ArtistScoreFields)[]).some(key => hasChanged(toChangeValue(artist[key]), toChangeValue(fields[key] ?? null)));
        if (changed) await ArtistModel.updateArtist(artist.spotifyID, fields, tx);
      }

      if (artists.length > 0) {
        await ArtistScoreService.updateAllLeaderboardPositions(tx);
      }
    });

    const refreshed = new Map((await ArtistModel.getAllArtists()).map(artist => [artist.spotifyID, artist]));
    const changedArtists: { spotifyID: string; name: string; changes: ScoreChange[] }[] = [];

    for (const before of artists) {
      const after = refreshed.get(before.spotifyID);
      if (!after) continue;

      const changes: ScoreChange[] = [];
      for (const field of CHANGE_FIELDS) {
        const beforeValue = toChangeValue(before[field]);
        const afterValue = toChangeValue(after[field]);
        if (hasChanged(beforeValue, afterValue)) changes.push({ field, before: beforeValue, after: afterValue });
      }

      if (changes.length > 0) {
        changedArtists.push({ spotifyID: after.spotifyID, name: after.name, changes });
      }
    }

    return {
      updatedCount: changedArtists.length,
      totalProcessed: artists.length,
      changedArtists,
    };
  }

  /** Updates the overall, peak and latest leaderboard positions of all rated artists. */
  static async updateAllLeaderboardPositions(executor: Executor = db) {
    const allArtists = await ArtistModel.getAllArtists(executor);
    const ratedArtists = allArtists.filter(artist => !artist.unrated);

    if (ratedArtists.length === 0) return;

    const overallData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.totalScore,
    }));

    const peakData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.peakScore,
    }));

    const latestData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.latestScore,
    }));

    const overallPositions = calculateLeaderboardPositions(overallData);
    const peakPositions = calculateLeaderboardPositions(peakData);
    const latestPositions = calculateLeaderboardPositions(latestData);

    for (const artist of overallPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, artist.position, executor);
    }

    for (const artist of peakPositions) {
      await ArtistModel.updatePeakLeaderboardPosition(artist.id, artist.position, executor);
    }

    for (const artist of latestPositions) {
      await ArtistModel.updateLatestLeaderboardPosition(artist.id, artist.position, executor);
    }
  }
}
