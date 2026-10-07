import type { DisplayTrack, ExtractedColor } from "@shared/types";

export type TextFormat = "bold" | "italic" | "underline" | "colour";

/** The marks the review text uses. The colour is the red the site has always used for album names. */
const FORMAT_MARKS: Record<TextFormat, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  underline: ["__", "__"],
  colour: ["{color:#fb2c36}", "{color}"],
};

/**
 * Wraps the selected part of the text in the marks for a format.
 * Returns the new text and the place to put the cursor, just after the closing mark.
 */
export function formatSelection(text: string, start: number, end: number, format: TextFormat): { text: string; cursor: number } {
  const [open, close] = FORMAT_MARKS[format];
  return wrapSelection(text, start, end, open, close);
}

/**
 * Wraps the selected part of the text in a link to an album.
 * Returns the new text and the place to put the cursor, just after the closing mark.
 */
export function linkAlbumSelection(text: string, start: number, end: number, albumSpotifyID: string): { text: string; cursor: number } {
  return wrapSelection(text, start, end, `{album:${albumSpotifyID}}`, "{album}");
}

function wrapSelection(text: string, start: number, end: number, open: string, close: string) {
  const selected = text.slice(start, end);
  return {
    text: text.slice(0, start) + open + selected + close + text.slice(end),
    cursor: end + open.length + close.length,
  };
}

export interface ReviewFormValues {
  /** Every track in album order. A rating of 0 means unrated, and pick marks the best and worst tracks. */
  tracks: DisplayTrack[];
  reviewContent: string;
  /** Points added or taken away for how the album works as a whole, from -5 to +5 */
  bonus: number;
  colours: ExtractedColor[];
  /** Genre names */
  genres: string[];
  affectsArtistScore: boolean;
  /** The artists the album is credited to */
  creditedArtistIDs: string[];
  /** The credited artists whose score the album counts towards */
  scoreArtistIDs: string[];
}

/** Turns the form's values into the body the create and edit endpoints take, apart from the album. */
export function toReviewPayload(values: ReviewFormValues) {
  return {
    ratedTracks: values.tracks.map(track => ({ ...track, rating: track.rating ?? 0, pick: track.pick ?? null })),
    reviewContent: values.reviewContent,
    bonus: values.bonus,
    affectsArtistScore: values.affectsArtistScore,
    colors: values.colours,
    genres: values.genres,
    selectedArtistIDs: values.creditedArtistIDs,
    scoreArtistIDs: values.scoreArtistIDs,
  };
}

/** Shows a bonus with its sign and at most one decimal place, such as "+1.5", "-2" or "0". */
export function formatBonus(bonus: number): string {
  const rounded = Number(bonus.toFixed(1));
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}
