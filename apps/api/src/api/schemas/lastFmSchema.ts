import { z } from "zod";

/** Last.fm sends its errors as a body with this shape, sometimes with a 200 status. */
export const lastFmErrorSchema = z.object({
  error: z.number(),
  message: z.string(),
});

/** The artists Last.fm listeners play alongside an artist, closest first. `match` runs from 0 to 1 and comes as a string. */
export const lastFmSimilarArtistsSchema = z.object({
  similarartists: z.object({
    artist: z.array(z.object({ name: z.string(), match: z.coerce.number() })),
  }),
});

export type LastFmSimilarArtist = z.infer<typeof lastFmSimilarArtistsSchema>["similarartists"]["artist"][number];

/** An artist's albums, most played first. `playcount` comes as a string. */
export const lastFmTopAlbumsSchema = z.object({
  topalbums: z.object({
    album: z.array(z.object({ name: z.string(), playcount: z.coerce.number() })),
  }),
});

export type LastFmTopAlbum = z.infer<typeof lastFmTopAlbumsSchema>["topalbums"]["album"][number];
