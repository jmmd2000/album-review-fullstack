import { z } from "zod";
import { MAX_ALBUM_BONUS } from "@shared/constants";
import { featureSchema, spotifyImageSchema } from "@/api/schemas/reviewSchema";

const draftTrackSchema = z.object({
  spotifyID: z.string(),
  artistSpotifyID: z.string(),
  artistName: z.string(),
  name: z.string(),
  duration: z.number(),
  rating: z.number().min(0).max(10).optional(),
  pick: z.enum(["best", "worst"]).nullable().optional(),
  features: z.array(featureSchema),
});

/** The review form's values, as a draft stores them. */
export const draftFormValuesSchema = z.object({
  tracks: z.array(draftTrackSchema),
  reviewContent: z.string(),
  bonus: z.number().min(-MAX_ALBUM_BONUS).max(MAX_ALBUM_BONUS),
  colours: z.array(z.object({ hex: z.string() })),
  genres: z.array(z.string()),
  affectsArtistScore: z.boolean(),
  creditedArtistIDs: z.array(z.string()),
  scoreArtistIDs: z.array(z.string()),
});

/** A draft save: the form's values, and the album details its card on the bookmarks page shows. */
export const saveDraftSchema = z.object({
  formValues: draftFormValuesSchema,
  album: z.object({
    name: z.string(),
    artistName: z.string(),
    artistSpotifyID: z.string(),
    releaseYear: z.number().int(),
    imageURLs: z.array(spotifyImageSchema),
  }),
});

export type DraftFormValues = z.infer<typeof draftFormValuesSchema>;
export type SaveDraftData = z.infer<typeof saveDraftSchema>;
