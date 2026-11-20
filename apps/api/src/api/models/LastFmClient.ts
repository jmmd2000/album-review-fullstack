import type { z } from "zod";
import { AppError } from "@/api/AppError";
import { env } from "@/config/env";
import { sleep } from "@/helpers/sleep";
import { lastFmErrorSchema, lastFmSimilarArtistsSchema, lastFmTopAlbumsSchema, lastFmTopTagsSchema, type LastFmSimilarArtist, type LastFmTag, type LastFmTopAlbum } from "@/api/schemas/lastFmSchema";

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";
// Last.fm asks each app to send at most 5 requests a second. Every caller shares one queue, so one request each 200ms stays under that.
const GAP_MS = 200;
const SIMILAR_ARTIST_LIMIT = 100;
const TOP_ALBUM_LIMIT = 10;
const NOT_FOUND_ERROR_CODE = 6;
const RATE_LIMIT_ERROR_CODE = 29;

/** Last.fm refused a request because the app sent too many. Later requests fail too until the limit resets. */
export class LastFmLimitError extends Error {}

/**
 * Raw calls to the Last.fm API. Every reply is checked against its schema.
 * Each call throws an AppError when Last.fm fails or sends a reply the app can't read, and a LastFmLimitError when the app sent too many requests.
 */
export class LastFmClient {
  private static queue: Promise<unknown> = Promise.resolve();
  private static lastCallAt = 0;

  /**
   * The artists Last.fm listeners play alongside this artist, closest first, up to 100.
   * Last.fm corrects small spelling differences in the name.
   * @returns The similar artists, or null when Last.fm doesn't know the artist.
   */
  static async getSimilarArtists(artistName: string): Promise<LastFmSimilarArtist[] | null> {
    const query = new URLSearchParams({ method: "artist.getsimilar", artist: artistName, autocorrect: "1", limit: String(SIMILAR_ARTIST_LIMIT) });
    const reply = await this.request(query, lastFmSimilarArtistsSchema);
    return reply ? reply.similarartists.artist : null;
  }

  /**
   * An artist's albums, most played first, up to 10.
   * @returns The albums, or null when Last.fm doesn't know the artist.
   */
  static async getTopAlbums(artistName: string): Promise<LastFmTopAlbum[] | null> {
    const query = new URLSearchParams({ method: "artist.gettopalbums", artist: artistName, autocorrect: "1", limit: String(TOP_ALBUM_LIMIT) });
    const reply = await this.request(query, lastFmTopAlbumsSchema);
    return reply ? [...reply.topalbums.album].sort((a, b) => b.playcount - a.playcount) : null;
  }

  /**
   * The tags listeners give an artist, most used first.
   * @returns The tags, or null when Last.fm doesn't know the artist.
   */
  static async getTopTags(artistName: string): Promise<LastFmTag[] | null> {
    const query = new URLSearchParams({ method: "artist.gettoptags", artist: artistName, autocorrect: "1" });
    const reply = await this.request(query, lastFmTopTagsSchema);
    return reply ? reply.toptags.tag : null;
  }

  /**
   * Sends one request at a time, at least GAP_MS after the last one started.
   * @returns The checked reply, or null when Last.fm doesn't know the thing asked for.
   */
  private static request<Schema extends z.ZodType>(query: URLSearchParams, schema: Schema): Promise<z.output<Schema> | null> {
    const call = this.queue.then(async () => {
      const response = await this.send(query);
      const body: unknown = await response.json().catch(() => null);

      const error = lastFmErrorSchema.safeParse(body);
      if (error.success) {
        if (error.data.error === NOT_FOUND_ERROR_CODE) return null;
        if (error.data.error === RATE_LIMIT_ERROR_CODE) throw new LastFmLimitError("Last.fm refused the request because the app sent too many.");
        throw new AppError(`Last.fm sent an error for ${query.get("method")}: ${error.data.message}`, 502);
      }
      if (!response.ok) throw new AppError(`Last.fm answered ${response.status} for ${query.get("method")}`, 502);

      const reply = schema.safeParse(body);
      if (!reply.success) throw new AppError(`Last.fm sent a reply the app can't read for ${query.get("method")}.`, 502);
      return reply.data;
    });
    // A failed call must not stop the ones queued after it
    this.queue = call.catch(() => undefined);
    return call;
  }

  private static async send(query: URLSearchParams): Promise<Response> {
    const wait = this.lastCallAt + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastCallAt = Date.now();

    const url = `${BASE_URL}?${query}&api_key=${env.LASTFM_API_KEY}&format=json`;
    return fetch(url, { headers: { Accept: "application/json", "User-Agent": "JamesReviewsMusic" } });
  }
}
