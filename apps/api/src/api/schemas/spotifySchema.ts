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

/** Spotify sends a new refresh token only when it replaces the old one. */
export const userTokenResponseSchema = tokenResponseSchema.extend({
  refresh_token: z.string().optional(),
});

export const tokenErrorSchema = z.object({
  error: z.string(),
});

/** A search hit. `album_type` is "album", "single" or "compilation", and Spotify labels an EP as a single. */
const albumSearchItemSchema = albumSummarySchema.extend({
  album_type: z.string(),
});

/** A page of an artist's albums. `release_date` is "2024", "2024-06" or "2024-06-07", as `release_date_precision` says. */
export const artistAlbumsResponseSchema = z.object({
  items: z.array(albumSummarySchema.extend({ release_date_precision: z.enum(["year", "month", "day"]) })),
});

export const albumSearchResponseSchema = z.object({
  albums: z.object({
    items: z.array(albumSearchItemSchema),
    next: z.string().nullable(),
  }),
});

const albumTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration_ms: z.number(),
  artists: z.array(artistSummarySchema),
});

export const albumTrackPageSchema = z.object({
  items: z.array(albumTrackSchema),
  next: z.string().nullable(),
});

export const albumResponseSchema = albumSummarySchema.extend({
  uri: z.string(),
  external_ids: z.object({ upc: z.string().optional() }).optional(),
  tracks: z.object({
    items: z.array(albumTrackSchema),
  }),
});

/** The album as Spotify sends it, with only the first page of its tracks. */
export const albumReplySchema = albumResponseSchema.extend({
  tracks: albumTrackPageSchema,
});

/** The admin's latest plays, newest first. `played_at` is an ISO time in UTC. */
export const recentlyPlayedResponseSchema = z.object({
  items: z.array(
    z.object({
      played_at: z.string(),
      track: albumTrackSchema.extend({ album: albumSummarySchema }),
    })
  ),
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
export type SpotifyAlbumSearchItem = z.infer<typeof albumSearchItemSchema>;
export type SpotifyAlbumSearchResponse = z.infer<typeof albumSearchResponseSchema>;
export type SpotifyAlbumResponse = z.infer<typeof albumResponseSchema>;
export type SpotifyArtistResponse = z.infer<typeof artistResponseSchema>;
export type SpotifyPlay = z.infer<typeof recentlyPlayedResponseSchema>["items"][number];

export type SpotifyArtistAlbum = z.infer<typeof artistAlbumsResponseSchema>["items"][number];
