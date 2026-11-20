import { z } from "zod";

export const playCountQuerySchema = z.object({
  from: z.iso.datetime({ error: "Give the range's start as an ISO time." }),
  to: z.iso.datetime({ error: "Give the range's end as an ISO time." }),
});

/** One play from the streaming history export, as the Settings page sends it */
const importedPlaySchema = z.object({
  playedAt: z.iso.datetime(),
  msPlayed: z.number().int().min(0),
  trackSpotifyID: z.string().min(1).max(255),
  trackName: z.string().min(1).max(255),
});

export const importPlaysSchema = z.object({
  plays: z.array(importedPlaySchema).min(1, { error: "The import has no plays." }),
});

const dateSchema = z.iso.date({ error: "Give dates as YYYY-MM-DD." });

export const topQuerySchema = z
  .object({
    kind: z.enum(["artists", "tracks", "albums", "genres"]),
    period: z.enum(["4-weeks", "6-months", "year", "all", "custom"]).default("4-weeks"),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine(query => query.period !== "custom" || (query.from !== undefined && query.to !== undefined && query.from <= query.to), {
    error: "A custom period needs a start date on or before its end date.",
  });
