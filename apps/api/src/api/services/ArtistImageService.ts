import { ArtistModel } from "@/api/models/Artist";
import { fetchArtistHeadersFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import type { JobEmit } from "@/api/services/JobService";
import { areImageUrlsSame, normalizeSpotifyImageUrl } from "@/helpers/normaliseSpotifyImageURL";
import { SettingsService } from "./SettingsService";
import { AppError } from "@/api/AppError";

export type ArtistImageJob = "images" | "headers";

const runningJobs = new Set<ArtistImageJob>();

/** Updates artist photos and header images, one at a time or as a batch job that reports its progress. */
export class ArtistImageService {
  /** Tells whether a run of the job is going now. */
  static isRunning(job: ArtistImageJob): boolean {
    return runningJobs.has(job);
  }

  /**
   * Gets each artist's header from their Spotify page and saves the ones that changed.
   * Only one run goes at a time. A second run throws a 409 AppError.
   */
  static async updateArtistHeaders(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    return this.runAlone("headers", () => this.refreshHeaders(all, spotifyID, emit));
  }

  /**
   * Gets each artist's photos from Spotify and saves the ones that changed.
   * Only one run goes at a time. A second run throws a 409 AppError.
   */
  static async updateArtistImages(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    return this.runAlone("images", () => this.refreshImages(all, spotifyID, emit));
  }

  private static async runAlone(job: ArtistImageJob, run: () => Promise<void>): Promise<void> {
    if (runningJobs.has(job)) throw new AppError("This job is already running.", 409);
    runningJobs.add(job);
    try {
      await run();
    } finally {
      runningJobs.delete(job);
    }
  }

  static async updateSingleArtistHeader(spotifyID: string, headerImage: string | null): Promise<void> {
    const artist = await ArtistModel.getArtistBySpotifyID(spotifyID);
    if (!artist) throw new AppError("Artist not found.", 404);
    await ArtistModel.updateArtist(spotifyID, {
      headerImage,
      imageUpdatedAt: new Date(),
    });
  }

  private static async refreshHeaders(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    if (!all && !spotifyID) throw new AppError("Must specify either all=true or a spotifyID", 400);

    let artists;
    if (all) {
      artists = await ArtistModel.getAllArtists();
    } else {
      const artist = await ArtistModel.getArtistBySpotifyID(spotifyID!);
      if (!artist) throw new AppError("Artist not found", 404);
      artists = [artist];
    }

    const FAKE = false;
    const BATCH_SIZE = 6;

    const total = artists.length;

    const batches = [];
    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
      batches.push(artists.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const spotifyIDs = batch.map(a => a.spotifyID);

      const onProgress = (completed: number, _totalInBatch: number, currentArtistID?: string) => {
        if (currentArtistID) {
          const currentArtist = batch.find(a => a.spotifyID === currentArtistID);
          const artistName = currentArtist?.name || "Unknown Artist";
          const artistImage = currentArtist?.imageURLs?.[0]?.url;

          emit("fetching", {
            index: processedCount + completed,
            total,
            spotifyID: currentArtistID,
            artistName: `${FAKE ? "[FAKE] " : ""}${artistName}`,
            artistImage,
          });
        }
      };

      const headerResults = await fetchArtistHeadersFromSpotify(spotifyIDs, BATCH_SIZE, onProgress, FAKE);

      for (let i = 0; i < batch.length; i++) {
        const artist = batch[i];
        const { spotifyID: id, name, imageURLs } = artist;
        const artistImage = imageURLs?.[0]?.url;

        processedCount++;

        // Send progress first. The live banner on the settings page updates from it.
        emit("progress", {
          index: processedCount,
          total,
          spotifyID: id,
          artistName: name,
          artistImage,
        });

        const newHeaderImage = headerResults[id];

        if (newHeaderImage) {
          const current = artist.headerImage;

          const normalizedCurrent = current ? normalizeSpotifyImageUrl(current) : null;
          const normalizedNew = normalizeSpotifyImageUrl(newHeaderImage);

          if (normalizedCurrent === normalizedNew) {
            emit("same", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current ?? undefined,
            });
          } else {
            emit("changed", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current ?? undefined,
              newHeaderImage: newHeaderImage,
            });

            try {
              await ArtistModel.updateArtist(id, {
                headerImage: newHeaderImage,
                imageUpdatedAt: new Date(),
              });
            } catch (err) {
              console.error(`Header update failed for ${id}:`, err);
              emit("failed", {
                spotifyID: id,
                index: processedCount,
                total,
                artistName: name,
                artistImage,
                headerImage: current ?? undefined,
                message: (err as Error).message,
              });
            }
          }
        } else {
          emit("failed", {
            spotifyID: id,
            total,
            index: processedCount,
            artistName: FAKE ? `[FAKE] ${name}` : name,
            artistImage,
            message: FAKE ? "[FAKE] Failed to fetch header image" : "Failed to fetch header image",
          });
        }
      }
    }

    await SettingsService.setLastRun("headers", new Date());
  }

  private static async refreshImages(all: boolean, spotifyID: string | undefined, emit: JobEmit): Promise<void> {
    if (!all && !spotifyID) throw new AppError("Must specify either all=true or a spotifyID", 400);

    let artists;
    if (all) {
      artists = await ArtistModel.getAllArtists();
    } else {
      const artist = await ArtistModel.getArtistBySpotifyID(spotifyID!);
      if (!artist) throw new AppError("Artist not found", 404);
      artists = [artist];
    }

    const total = artists.length;

    for (let i = 0; i < total; i++) {
      const { spotifyID: id, name, imageURLs } = artists[i];

      const currentArtistImage = imageURLs && imageURLs.length > 0 ? imageURLs[0].url : undefined;

      emit("progress", {
        index: i + 1,
        total,
        spotifyID: id,
        artistName: name,
        artistImage: currentArtistImage,
      });

      const artistData = await fetchArtistFromSpotify(id);
      if (!artistData) continue;

      const newArtistImage = artistData.images.length > 0 ? artistData.images[0].url : undefined;

      const currentUrls = (imageURLs || []).map(img => img.url).sort();
      const fetchedUrls = artistData.images.map(img => img.url).sort();

      const same = areImageUrlsSame(currentUrls, fetchedUrls);

      if (same) {
        emit("same", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
        });
        continue;
      } else {
        emit("changed", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
          newArtistImage: newArtistImage,
        });

        try {
          await ArtistModel.updateArtist(id, {
            imageURLs: artistData.images,
            imageUpdatedAt: new Date(),
          });
        } catch (err) {
          console.error(`Image update failed for ${id}:`, err);
          emit("failed", {
            index: i + 1,
            total,
            spotifyID: id,
            artistName: name,
            artistImage: currentArtistImage,
            message: (err as Error).message,
          });
        }
      }
    }

    await SettingsService.setLastRun("images", new Date());
  }
}
