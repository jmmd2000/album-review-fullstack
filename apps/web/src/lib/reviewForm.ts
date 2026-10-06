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
    affectsArtistScore: values.affectsArtistScore,
    colors: values.colours,
    genres: values.genres,
    selectedArtistIDs: values.creditedArtistIDs,
    scoreArtistIDs: values.scoreArtistIDs,
  };
}
