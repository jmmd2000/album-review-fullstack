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

// The artist data the Spotify web player loads. The Web API doesn't give headers, so the scraper reads them from here.
export const artistOverviewResponseSchema = z.object({
  data: z.object({
    artistUnion: z.object({
      id: z.string(),
      headerImage: z
        .object({
          data: z.object({
            sources: z.array(
              z.object({
                url: z.string(),
                maxWidth: z.number(),
                maxHeight: z.number(),
              })
            ),
          }),
        })
        .nullable(),
    }),
  }),
});

export type SpotifyAlbumSummary = z.infer<typeof albumSummarySchema>;
export type SpotifyAlbumSearchResponse = z.infer<typeof albumSearchResponseSchema>;
export type SpotifyAlbumResponse = z.infer<typeof albumResponseSchema>;
export type SpotifyArtistResponse = z.infer<typeof artistResponseSchema>;
