import type { z } from "zod";
import { AppError } from "@/api/AppError";
import { sleep } from "@/helpers/sleep";
import { deezerAlbumSearchSchema, deezerErrorSchema, deezerRelatedArtistsSchema, type DeezerAlbumSearchHit, type DeezerRelatedArtist } from "@/api/schemas/deezerSchema";

const BASE_URL = "https://api.deezer.com";
// Deezer allows 50 requests every 5 seconds. One request each 120ms stays under that, because every caller shares one queue.
const GAP_MS = 120;
const QUOTA_ERROR_CODE = 4;
const NO_DATA_ERROR_CODE = 800;

/** Deezer refused a request because the app sent too many. Later requests fail too until the limit resets. */
export class DeezerLimitError extends Error {}

/**
 * Raw calls to the Deezer API. Every reply is checked against its schema.
 * Each call throws an AppError when Deezer fails or sends a reply the app can't read, and a DeezerLimitError when the app sent too many requests.
 */
export class DeezerClient {
  private static queue: Promise<unknown> = Promise.resolve();
  private static lastCallAt = 0;

  /** Searches for an album by its title and its artist's name, best match first. */
  static async searchAlbums(title: string, artistName: string): Promise<DeezerAlbumSearchHit[]> {
    const query = encodeURIComponent(`artist:${quoted(artistName)} album:${quoted(title)}`);
    const reply = await this.request(`/search/album?q=${query}&limit=5`, deezerAlbumSearchSchema);
    return reply?.data ?? [];
  }

  /** The artists Deezer listeners play alongside this artist, closest first. Gives an empty list when Deezer has none. */
  static async getRelatedArtists(deezerID: number): Promise<DeezerRelatedArtist[]> {
    const reply = await this.request(`/artist/${deezerID}/related`, deezerRelatedArtistsSchema);
    return reply?.data ?? [];
  }

  /**
   * Sends one request at a time, at least GAP_MS after the last one started.
   * @returns The checked reply, or null when Deezer has no data for the request.
   */
  private static request<Schema extends z.ZodType>(path: string, schema: Schema): Promise<z.output<Schema> | null> {
    const call = this.queue.then(async () => {
      const response = await this.send(path);
      if (!response.ok) throw new AppError(`Deezer answered ${response.status} for ${path}`, 502);

      const body: unknown = await response.json();
      const error = deezerErrorSchema.safeParse(body);
      if (error.success) {
        if (error.data.error.code === NO_DATA_ERROR_CODE) return null;
        if (error.data.error.code === QUOTA_ERROR_CODE) throw new DeezerLimitError("Deezer refused the request because the app sent too many.");
        throw new AppError(`Deezer sent an error for ${path}: ${error.data.error.message}`, 502);
      }

      const reply = schema.safeParse(body);
      if (!reply.success) throw new AppError(`Deezer sent a reply the app can't read for ${path}.`, 502);
      return reply.data;
    });
    // A failed call must not stop the ones queued after it
    this.queue = call.catch(() => undefined);
    return call;
  }

  private static async send(path: string): Promise<Response> {
    const wait = this.lastCallAt + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastCallAt = Date.now();

    return fetch(BASE_URL + path, { headers: { Accept: "application/json" } });
  }
}

/** Puts a value inside a quoted Deezer search term. Deezer has no escape for a double quote, so it drops them. */
function quoted(value: string): string {
  return `"${value.replace(/"/g, "")}"`;
}
