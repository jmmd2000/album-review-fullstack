import { z } from "zod";

/** A link lookup: the MusicBrainz releases a Spotify album link points to. */
export const urlLookupSchema = z.object({
  relations: z.array(z.object({ release: z.object({ id: z.string() }).optional() })).default([]),
});

/** A release search, best match first. `score` runs from 0 to 100. */
export const releaseSearchSchema = z.object({
  releases: z.array(z.object({ id: z.string(), score: z.number() })),
});

/** The release groups a release belongs to, with their genres and how many people voted for each. */
export const releaseGroupBrowseSchema = z.object({
  "release-groups": z.array(
    z.object({
      genres: z.array(z.object({ name: z.string(), count: z.number() })).default([]),
    })
  ),
});

export type MusicBrainzGenre = z.infer<typeof releaseGroupBrowseSchema>["release-groups"][number]["genres"][number];
