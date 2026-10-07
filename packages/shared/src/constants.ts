/**
 * Number of items per page in paginated queries
 */
export const PAGE_SIZE = 36;

/** The most the hand-set bonus on a review can add to or take from an album's score */
export const MAX_ALBUM_BONUS = 5;

/** How much each of an artist's releases counts, compared with the release ranked just above it */
export const SCORE_DECAY = 0.6;

/** What an artist with only one counting release scores, as a fraction of that release's score */
export const SINGLE_RELEASE_DISCOUNT = 0.9;
