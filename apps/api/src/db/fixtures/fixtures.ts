import type { CapturedAlbum } from "./captured";
import { capturedAlbums } from "./albums";

// The rating pattern gives every album fixed, varied track ratings without
// hand-writing one number per track. The offset staggers it per album so
// the seeded scores differ.
const RATING_PATTERN = [8, 7, 9, 6, 10, 7, 8, 5, 9, 6];

export const ratingFor = (trackIndex: number, offset: number): number => RATING_PATTERN[(trackIndex + offset) % RATING_PATTERN.length];

export const REVIEW_CONTENT =
  "Seeded review. The scores here are deterministic fixtures, the same numbers come out every run so the e2e tests can assert against them.";

/** How one captured album should be reviewed by the seeder. */
export interface ReviewFixture {
  spotifyID: string;
  /** Offset into the rating pattern so albums score differently */
  offset: number;
  genres: string[];
  /** Indexes into the album's artists whose score this album must not affect */
  scoreExcludedArtistIndexes?: number[];
  /** Whether the review affects artist scores at all */
  affectsArtistScore: boolean;
}

// The first eight captured albums get reviews, the last two get bookmarks.
// Coverage: two Billie Eilish and three Post Malone albums exercise artist
// aggregates and the leaderboard, Her Loss is the multi-artist album with one
// artist excluded from scoring, and the Sabrina Carpenter album is the review
// that affects no artist score at all.
export const REVIEWED: ReviewFixture[] = [
  { spotifyID: "7aJuG4TFXa2hmE4z1yxc3n", offset: 0, genres: ["alternative-pop", "indie"], affectsArtistScore: true },
  { spotifyID: "3HHNR44YbP7XogMVwzbodx", offset: 1, genres: ["hip-hop/rap"], affectsArtistScore: true },
  { spotifyID: "2ODvWsOgouMbaA5xf0RkJe", offset: 2, genres: ["r&b/soul", "pop/rap"], affectsArtistScore: true },
  { spotifyID: "6trNtQUgC8cgbWcqoMYkOR", offset: 3, genres: ["hip-hop/rap", "pop/rap"], affectsArtistScore: true },
  { spotifyID: "0S0KGZnfBGSIssfF54WSJh", offset: 4, genres: ["alternative-pop", "electronic"], affectsArtistScore: true },
  { spotifyID: "4g1ZRSobMefqF6nelkgibi", offset: 5, genres: ["pop/rap"], affectsArtistScore: true },
  { spotifyID: "5MS3MvWHJ3lOZPLiMxzOU6", offset: 6, genres: ["hip-hop/rap", "alternative-rap"], scoreExcludedArtistIndexes: [1], affectsArtistScore: true },
  { spotifyID: "55huyEjfSVsk9nnmmKp5df", offset: 7, genres: ["alternative-pop"], affectsArtistScore: false },
];

export const BOOKMARKED_IDS = ["392p3shh2jkxUxY2VHvlH8", "2vlhlrgMaXqcnhRqIEV9AP"];

/** Looks up a captured album by spotify id, throwing when the fixture set and the capture drift. */
export const capturedAlbum = (spotifyID: string): CapturedAlbum => {
  const album = capturedAlbums.find(candidate => candidate.spotifyID === spotifyID);
  if (!album) throw new Error(`Fixture album ${spotifyID} is not in albums.ts, re-run db:capture-fixtures`);
  return album;
};
