import type { z } from "zod";
import { AppError } from "@/api/AppError";
import { APP_VERSION } from "@/config/appVersion";
import { sleep } from "@/helpers/sleep";
import { releaseGroupBrowseSchema, releaseSearchSchema, urlLookupSchema, type MusicBrainzGenre } from "@/api/schemas/musicBrainzSchema";

const BASE_URL = "https://musicbrainz.org/ws/2";
// MusicBrainz asks every app to name itself and give a way to find it
const USER_AGENT = `AlbumReviews/${APP_VERSION} ( https://jamesreviewsmusic.com )`;
// MusicBrainz allows one request a second from each app
const GAP_MS = 1000;
const MIN_TITLE_SCORE = 90;

/** Puts a value inside a quoted MusicBrainz search term, escaping the characters that would end the quote. */
function quoted(value: string): string {
  return `"${value.replace(/[\\"]/g, "\\$&")}"`;
}

/**
 * Raw calls to the MusicBrainz API. Every reply is checked against its schema.
 * Each call throws when MusicBrainz fails, can't be read or the signal aborts.
 */
export class MusicBrainzClient {
  private static queue: Promise<unknown> = Promise.resolve();
  private static lastCallAt = 0;

  /** The release a Spotify album link points to, or null when MusicBrainz has no such link. */
  static async findReleaseBySpotifyLink(spotifyAlbumID: string, signal: AbortSignal): Promise<string | null> {
    const resource = encodeURIComponent(`https://open.spotify.com/album/${spotifyAlbumID}`);
    const reply = await this.request(`/url?resource=${resource}&inc=release-rels&fmt=json`, urlLookupSchema, signal);
    return reply?.relations.find(relation => relation.release)?.release?.id ?? null;
  }

  /** The best release with this barcode, or null when there is none. */
  static async findReleaseByBarcode(barcode: string, signal: AbortSignal): Promise<string | null> {
    const reply = await this.request(`/release?query=${encodeURIComponent(`barcode:${barcode}`)}&fmt=json`, releaseSearchSchema, signal);
    return reply?.releases[0]?.id ?? null;
  }

  /** The best release with this title by this artist, or null when no release scores 90 or more. */
  static async findReleaseByTitle(title: string, artistName: string, signal: AbortSignal): Promise<string | null> {
    const query = `release:${quoted(title)} AND artist:${quoted(artistName)}`;
    const reply = await this.request(`/release?query=${encodeURIComponent(query)}&fmt=json`, releaseSearchSchema, signal);
    const best = reply?.releases[0];
    return best && best.score >= MIN_TITLE_SCORE ? best.id : null;
  }

  /** The genres of the album a release belongs to, most voted first. */
  static async getReleaseGroupGenres(releaseID: string, signal: AbortSignal): Promise<MusicBrainzGenre[]> {
    const reply = await this.request(`/release-group?release=${releaseID}&inc=genres&fmt=json`, releaseGroupBrowseSchema, signal);
    const genres = reply?.["release-groups"][0]?.genres ?? [];
    return [...genres].sort((a, b) => b.count - a.count);
  }

  /**
   * Sends one request at a time, at least a second after the last one started. A 503, which MusicBrainz
   * sends when it's busy or the app is too fast, is tried once more.
   * @returns The checked reply, or null when MusicBrainz answers 404.
   */
  private static request<Schema extends z.ZodType>(path: string, schema: Schema, signal: AbortSignal): Promise<z.output<Schema> | null> {
    const call = this.queue.then(async () => {
      let response = await this.send(path, signal);
      if (response.status === 503) response = await this.send(path, signal);

      if (response.status === 404) return null;
      if (!response.ok) throw new AppError(`MusicBrainz answered ${response.status} for ${path}`, 502);
      return schema.parse(await response.json());
    });
    // A failed call must not stop the ones queued after it
    this.queue = call.catch(() => undefined);
    return call;
  }

  private static async send(path: string, signal: AbortSignal): Promise<Response> {
    const wait = this.lastCallAt + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastCallAt = Date.now();

    return fetch(BASE_URL + path, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal });
  }
}
