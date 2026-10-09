import { artistOverviewResponseSchema } from "@/api/schemas/spotifySchema";
import { logger } from "@/config/logger";
import { isSpotifyImageURL } from "@/helpers/spotifyImageID";

/** What a header scrape found for one artist. "none" means Spotify says the artist has no header. */
export type HeaderResult = { status: "found"; url: string } | { status: "none" } | { status: "failed" };

/**
 * Reads an artist's header from the artist data the Spotify web player loads.
 *
 * @param response The parsed JSON of the player's queryArtistOverview reply.
 * @param spotifyID The artist the reply should be for.
 * @returns The widest header, "none" if Spotify says the artist has no header, or "failed" if the reply can't be read,
 * is for another artist, or has no Spotify image URL. An unreadable reply is logged as a warning.
 */
export function readHeaderImage(response: unknown, spotifyID: string): HeaderResult {
  const result = artistOverviewResponseSchema.safeParse(response);
  if (!result.success) {
    logger.warn({ spotifyID, issues: result.error.issues }, "Spotify sent artist data the app can't read");
    return { status: "failed" };
  }

  const artist = result.data.data.artistUnion;
  if (artist.id !== spotifyID) return { status: "failed" };
  if (!artist.headerImage) return { status: "none" };

  const sources = artist.headerImage.data.sources.filter(source => isSpotifyImageURL(source.url));
  if (sources.length === 0) return { status: "failed" };

  const widestFirst = [...sources].sort((a, b) => b.maxWidth - a.maxWidth);
  return { status: "found", url: widestFirst[0].url };
}
