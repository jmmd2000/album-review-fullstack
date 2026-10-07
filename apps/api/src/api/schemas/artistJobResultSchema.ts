import { z } from "zod";

/** How an artist job's latest run went. It is saved in the settings table as JSON. */
export const artistJobResultSchema = z.object({
  source: z.enum(["scheduled", "manual"]),
  finishedAt: z.iso.datetime(),
  updated: z.number().int(),
  unchanged: z.number().int(),
  failed: z.number().int(),
  /** Set when the job threw and stopped before the end */
  stoppedEarly: z.boolean(),
});

export type ArtistJobResult = z.infer<typeof artistJobResultSchema>;
export type ArtistJobSource = ArtistJobResult["source"];
