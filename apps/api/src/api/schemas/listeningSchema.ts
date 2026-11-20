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
