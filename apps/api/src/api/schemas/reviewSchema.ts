import { z } from "zod";

const spotifyImageSchema = z.object({
  height: z.number(),
  url: z.string(),
  width: z.number(),
});

const featureSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const albumArtistSchema = z.object({
  spotifyID: z.string(),
  name: z.string(),
  imageURLs: z.array(spotifyImageSchema),
});

const ratedTrackSchema = z.object({
  spotifyID: z.string(),
  artistSpotifyID: z.string(),
  artistName: z.string(),
  name: z.string(),
  duration: z.number(),
  rating: z.number().min(0).max(10),
  features: z.array(featureSchema),
  imageURLs: z.array(spotifyImageSchema).optional(),
});

const extractedColourSchema = z.object({
  hex: z.string(),
});

// A review submitted from the create page carries the Spotify album. Only the
// fields the review pipeline reads are modelled; the rest of Spotify's payload
// is stripped. The nested tracks supply each track's stored metadata.
const spotifyAlbumSchema = z.object({
  id: z.string(),
  uri: z.string(),
  name: z.string(),
  release_date: z.string(),
  images: z.array(spotifyImageSchema),
  artists: z.array(z.object({ id: z.string(), name: z.string() })),
  albumArtists: z.array(albumArtistSchema).optional(),
  tracks: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        duration_ms: z.number(),
        artists: z.array(z.object({ id: z.string(), name: z.string() })),
      })
    ),
  }),
});

// A review submitted from the edit page carries the already-reviewed album. The
// pipeline only reads its identity and any attached album artists off it.
const reviewedAlbumSchema = z.object({
  spotifyID: z.string(),
  artistSpotifyID: z.string(),
  albumArtists: z.array(albumArtistSchema).optional(),
});

export const reviewDataSchema = z.object({
  ratedTracks: z.array(ratedTrackSchema),
  bestSong: z.string(),
  worstSong: z.string(),
  reviewContent: z.string(),
  affectsArtistScore: z.boolean(),
  album: z.union([spotifyAlbumSchema, reviewedAlbumSchema]).optional(),
  colors: z.array(extractedColourSchema),
  genres: z.array(z.string()),
  selectedArtistIDs: z.array(z.string()).optional(),
  scoreArtistIDs: z.array(z.string()).optional(),
});

export type ReceivedReviewData = z.infer<typeof reviewDataSchema>;
export type ReceivedSpotifyAlbum = z.infer<typeof spotifyAlbumSchema>;
export type ReceivedReviewedAlbum = z.infer<typeof reviewedAlbumSchema>;
