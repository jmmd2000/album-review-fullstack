import {
  DisplayArtist,
  GetPaginatedArtistsOptions,
  DisplayAlbum,
  DisplayTrack,
  SpotifyImage,
  ReviewedArtist,
} from "@shared/types";
import { ArtistModel } from "@/api/models/Artist";
import { AlbumModel } from "@/api/models/Album";
import { TrackModel } from "@/api/models/Track";
import { toSortableDate } from "@shared/helpers/formatDate";
import { fetchArtistHeadersFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import { getSocket } from "@/socket";
import {
  areImageUrlsSame,
  normalizeSpotifyImageUrl,
} from "@/helpers/normaliseSpotifyImageURL";
import { SettingsService } from "./settingsService";
import {
  calculateLeaderboardPositions,
  ArtistLeaderboardData,
} from "@/helpers/calculateLeaderboardPositions";

export class ArtistService {
  /**
   * Updates all leaderboard positions (overall, peak, latest) for all artists
   */
  static async updateAllLeaderboardPositions() {
    // Get all rated artists
    const allArtists = await ArtistModel.getAllArtists();
    const ratedArtists = allArtists.filter(artist => !artist.unrated);

    if (ratedArtists.length === 0) return;

    // Prepare data for each leaderboard type
    const overallData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.totalScore,
    }));

    const peakData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.peakScore,
    }));

    const latestData: ArtistLeaderboardData[] = ratedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      score: artist.latestScore,
    }));

    // Calculate positions for each leaderboard
    const overallPositions = calculateLeaderboardPositions(overallData);
    const peakPositions = calculateLeaderboardPositions(peakData);
    const latestPositions = calculateLeaderboardPositions(latestData);

    // Update overall leaderboard positions
    for (const artist of overallPositions) {
      await ArtistModel.updateLeaderboardPosition(artist.id, artist.position!);
    }

    // Update peak leaderboard positions
    for (const artist of peakPositions) {
      await ArtistModel.updatePeakLeaderboardPosition(artist.id, artist.position!);
    }

    // Update latest leaderboard positions
    for (const artist of latestPositions) {
      await ArtistModel.updateLatestLeaderboardPosition(artist.id, artist.position!);
    }
  }
  static async getAllArtists() {
    return ArtistModel.getAllArtists();
  }

  static async getPaginatedArtists(opts: GetPaginatedArtistsOptions) {
    const artists = await ArtistModel.getPaginatedArtists(opts);
    const totalArtistCount = await ArtistModel.getArtistCount();
    const furtherPages = artists.length > 35;
    if (furtherPages) artists.pop();

    const displayArtists: DisplayArtist[] = artists.map(artist => ({
      spotifyID: artist.spotifyID,
      name: artist.name,
      imageURLs: artist.imageURLs,
      totalScore: artist.totalScore,
      peakScore: artist.peakScore,
      latestScore: artist.latestScore,
      unrated: artist.unrated,
      albumCount: artist.reviewCount,
      leaderboardPosition: artist.leaderboardPosition,
      peakLeaderboardPosition: artist.peakLeaderboardPosition,
      latestLeaderboardPosition: artist.latestLeaderboardPosition,
    }));

    return {
      artists: displayArtists,
      furtherPages,
      totalCount: totalArtistCount,
    };
  }

  static async getArtistByID(artistID: string) {
    return ArtistModel.getArtistBySpotifyID(artistID);
  }

  static async getArtistDetails(artistID: string) {
    const artist = await ArtistModel.getArtistBySpotifyID(artistID);
    if (!artist) {
      throw new Error("Artist not found");
    }
    const albums = await AlbumModel.getAlbumsByArtist(artistID);
    const sortedAlbums = albums.sort((a, b) => {
      const dateA = new Date(toSortableDate(a.releaseDate, a.releaseYear)).getTime();
      const dateB = new Date(toSortableDate(b.releaseDate, b.releaseYear)).getTime();
      return dateB - dateA; // descending
    });

    const tracks = await TrackModel.getTracksByArtist(artistID);
    const albumImageMap = new Map(albums.map(album => [album.spotifyID, album.imageURLs]));

    const displayTracks: DisplayTrack[] = tracks.map(track => ({
      spotifyID: track.spotifyID,
      artistSpotifyID: track.artistSpotifyID,
      name: track.name,
      artistName: artist.name,
      duration: track.duration,
      rating: track.rating,
      features: track.features,
      imageURLs: albumImageMap.get(track.albumSpotifyID) || [],
    }));
    return { artist, albums: sortedAlbums, tracks: displayTracks };
  }

  static async deleteArtist(artistID: string) {
    return ArtistModel.deleteArtist(artistID);
  }

  static async updateSingleArtistHeader(
    spotifyID: string,
    headerImage: string | null
  ): Promise<void> {
    await ArtistModel.updateArtist(spotifyID, {
      headerImage,
      imageUpdatedAt: new Date(),
    });
  }

  static async updateArtistHeaders(all: boolean, spotifyID?: string): Promise<void> {
    const FAKE = false;
    const BATCH_SIZE = 6; // Process this many at a time
    const io = getSocket();

    const dbArtists = all
      ? await ArtistModel.getAllArtists()
      : spotifyID
      ? [await ArtistModel.getArtistBySpotifyID(spotifyID)]
      : [];

    if (!all && !spotifyID) throw new Error("Must specify either all=true or a spotifyID");

    const artists: ReviewedArtist[] = dbArtists.map(a => ({
      ...a,
      leaderboardPosition: a.leaderboardPosition ?? 0,
    }));

    const total = artists.length;

    // Split into batches
    const batches = [];
    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
      batches.push(artists.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const spotifyIDs = batch.map(a => a.spotifyID);

      const onProgress = (
        completed: number,
        _totalInBatch: number,
        currentArtistID?: string
      ) => {
        if (currentArtistID) {
          const currentArtist = batch.find(a => a.spotifyID === currentArtistID);
          const artistName = currentArtist?.name || "Unknown Artist";
          const artistImage = currentArtist?.imageURLs?.[0]?.url;

          // Emit fetching progress
          io.emit("artist:headers:fetching", {
            index: processedCount + completed,
            total,
            spotifyID: currentArtistID,
            artistName: `${FAKE ? "[FAKE] " : ""}${artistName}`,
            artistImage,
          });
        }
      };

      const headerResults = await fetchArtistHeadersFromSpotify(
        spotifyIDs,
        BATCH_SIZE,
        onProgress,
        FAKE
      );

      // emit progress, then same/changed/error
      for (let i = 0; i < batch.length; i++) {
        const artist = batch[i];
        const { spotifyID: id, name, imageURLs } = artist;
        const artistImage = imageURLs?.[0]?.url;

        processedCount++;

        console.log(`Processing artist ${processedCount}/${total}: ${name}`);

        // ALWAYS emit progress first (for live banner updates)
        io.emit("artist:headers:progress", {
          index: processedCount,
          total,
          spotifyID: id,
          artistName: name,
          artistImage,
        });

        // Get the fetched header from batch results
        const newHeaderImage = headerResults[id];

        if (newHeaderImage) {
          const current = (await ArtistModel.getArtistBySpotifyID(id))?.headerImage;

          // Normalize URLs for comparison
          const normalizedCurrent = current ? normalizeSpotifyImageUrl(current) : null;
          const normalizedNew = normalizeSpotifyImageUrl(newHeaderImage);

          if (normalizedCurrent === normalizedNew) {
            io.emit("artist:headers:same", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current,
            });
          } else {
            io.emit("artist:headers:changed", {
              index: processedCount,
              total,
              spotifyID: id,
              artistName: name,
              artistImage,
              headerImage: current,
              newHeaderImage: newHeaderImage,
            });

            try {
              await ArtistModel.updateArtist(id, {
                headerImage: newHeaderImage,
                imageUpdatedAt: new Date(),
              });
            } catch (err) {
              console.error(`Header update failed for ${id}:`, err);
              io.emit("artist:headers:error", {
                spotifyID: id,
                index: processedCount,
                total,
                artistName: name,
                artistImage,
                headerImage: current,
                message: (err as Error).message,
              });
            }
          }
        } else {
          console.log(`No header found for ${name} (${id}), skipping update.`);
          io.emit("artist:headers:error", {
            spotifyID: id,
            total,
            index: processedCount,
            artistName: FAKE ? `[FAKE] ${name}` : name,
            artistImage,
            headerImage: null,
            message: FAKE
              ? "[FAKE] Failed to fetch header image"
              : "Failed to fetch header image",
          });
        }
      }

      console.log(`Batch ${batchIndex + 1}/${batches.length} complete.`);
    }

    console.log(
      `${FAKE ? "FAKE MODE: " : ""}Artist header updates complete. Emitting done event.`
    );
    io.emit("artist:headers:done");
    await SettingsService.setLastRun("headers", new Date());
  }

  static async updateArtistImages(all: boolean, spotifyID?: string): Promise<void> {
    const io = getSocket();
    // Fetch the artist list
    const dbArtists = all
      ? await ArtistModel.getAllArtists()
      : spotifyID
      ? [await ArtistModel.getArtistBySpotifyID(spotifyID)]
      : [];
    if (!all && !spotifyID) {
      throw new Error("Must specify either all=true or a spotifyID");
    }

    // Normalize to ReviewedArtist shape
    const artists: ReviewedArtist[] = dbArtists.map(a => ({
      ...a,
      leaderboardPosition: a.leaderboardPosition ?? 0,
    }));

    const total = artists.length;

    for (let i = 0; i < total; i++) {
      const { spotifyID: id, name, imageURLs } = artists[i];

      const currentArtistImage =
        imageURLs && imageURLs.length > 0 ? imageURLs[0].url : undefined;

      io.emit("artist:images:progress", {
        index: i + 1,
        total,
        spotifyID: id,
        artistName: name,
        artistImage: currentArtistImage,
        // newArtistImage: newArtistImage,
      });

      // Fetch new data from Spotify
      const artistData = await fetchArtistFromSpotify(
        id,
        `https://api.spotify.com/v1/artists/${id}`
      );
      if (!artistData) continue;

      const newArtistImage =
        artistData.images && artistData.images.length > 0
          ? (artistData.images as SpotifyImage[])[0].url
          : undefined;

      // Get only the URL strings, sorted
      const dbRec = await ArtistModel.getArtistBySpotifyID(id);
      const currentUrls = (dbRec?.imageURLs || []).map(img => img.url).sort();
      const fetchedUrls = (artistData.images as SpotifyImage[]).map(img => img.url).sort();

      // Compare lengths and each URL
      const same = areImageUrlsSame(currentUrls, fetchedUrls);

      if (same) {
        io.emit("artist:images:same", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
        });
        continue;
      } else {
        io.emit("artist:images:changed", {
          index: i + 1,
          total,
          spotifyID: id,
          artistName: name,
          artistImage: currentArtistImage,
          newArtistImage: newArtistImage,
        });

        try {
          await ArtistModel.updateArtist(id, {
            imageURLs: artistData.images as SpotifyImage[],
            imageUpdatedAt: new Date(),
          });
        } catch (err) {
          console.error(`Image update failed for ${id}:`, err);
          io.emit("artist:images:error", {
            spotifyID: id,
            artistName: name,
            artistImage: currentArtistImage,
            message: (err as Error).message,
          });
        }
      }
    }

    io.emit("artist:images:done");
    await SettingsService.setLastRun("images", new Date());
  }
}
