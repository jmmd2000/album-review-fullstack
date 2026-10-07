import { z } from "zod";

// Each schema lists only the fields the app reads. Zod drops the rest, so a field Spotify adds never breaks a parse.

const imageSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

const artistSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const albumSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  release_date: z.string(),
  images: z.array(imageSchema),
  artists: z.array(artistSummarySchema).min(1),
});

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export const albumSearchResponseSchema = z.object({
  albums: z.object({
    items: z.array(albumSummarySchema),
  }),
});

export const albumResponseSchema = albumSummarySchema.extend({
  uri: z.string(),
  tracks: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        duration_ms: z.number(),
        artists: z.array(artistSummarySchema),
      })
    ),
  }),
});

export const artistResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(imageSchema),
});

export type SpotifyAlbumSearchResponse = z.infer<typeof albumSearchResponseSchema>;
export type SpotifyAlbumResponse = z.infer<typeof albumResponseSchema>;
export type SpotifyArtistResponse = z.infer<typeof artistResponseSchema>;
