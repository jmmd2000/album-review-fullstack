import { z } from "zod";

/** Deezer sends its errors with a 200 status, as a body with this shape. Code 4 means the app sent too many requests. */
export const deezerErrorSchema = z.object({
  error: z.object({ type: z.string(), message: z.string(), code: z.number() }),
});

/** An album search, best match first. Each album names only its main artist. */
export const deezerAlbumSearchSchema = z.object({
  data: z.array(z.object({ title: z.string(), artist: z.object({ id: z.number().int(), name: z.string() }) })),
});

/** The artists Deezer listeners play alongside an artist, closest first. */
export const deezerRelatedArtistsSchema = z.object({
  data: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

export type DeezerAlbumSearchHit = z.infer<typeof deezerAlbumSearchSchema>["data"][number];
export type DeezerRelatedArtist = z.infer<typeof deezerRelatedArtistsSchema>["data"][number];
