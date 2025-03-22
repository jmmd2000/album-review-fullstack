import "dotenv/config";
import { desc, eq, ilike, asc, or, count } from "drizzle-orm";
import { ReviewedAlbum, DisplayAlbum, ReviewedArtist, SpotifyImage, ExtractedColor, ReviewedTrack, DisplayTrack, GetAllAlbumsOptions } from "@shared/types";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "../../db/schema";
import { ReceivedReviewData } from "../controllers/albumController";
import getTotalDuration from "../../helpers/formatDuration";
import formatDate from "../../helpers/formatDate";
import { calculateArtistScore } from "../../helpers/calculateArtistScore";
import { fetchArtistFromSpotify } from "../../helpers/fetchArtistFromSpotify";
import { db } from "../../index";
import { getImageColors } from "../../helpers/getImageColors";
import { calculateAlbumScore } from "../../helpers/calculateAlbumScore";

export class Album {
  static async createAlbumReview(data: ReceivedReviewData) {
    // Check if the data is a SpotifyAlbum
    if (!("uri" in data.album && "artists" in data.album)) {
      throw new Error("Invalid album data: Expected a SpotifyAlbum, received something else");
    }

    const existingAlbum = await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, data.album.id))
      .then((results) => results[0]);

    if (existingAlbum) {
      throw new Error("Album already exists");
    }

    const roundedScore = calculateAlbumScore(data.ratedTracks);

    const tracks = data.ratedTracks;
    // See if the artist already exists
    const artist = await db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, data.album.artists[0].id))
      .then((results) => results[0]);

    let createdArtist = null;

    // If the artist doesn't exist, fetch the artist data from Spotify and create a new artist
    if (!artist) {
      const fetchedArtist = await fetchArtistFromSpotify(data.album.artists[0].id, data.album.artists[0].href);
      if (fetchedArtist) {
        createdArtist = await db
          .insert(reviewedArtists)
          .values({
            name: fetchedArtist.name,
            spotifyID: fetchedArtist.spotifyID,
            imageURLs: fetchedArtist.imageURLs,
            averageScore: roundedScore,
            leaderboardPosition: 0,
          })
          .returning()
          .then((results) => results[0]);
      }
    }

    const date = new Date(data.album.release_date);
    const year = date.getFullYear();
    const releaseDate = formatDate(data.album.release_date);
    const runtime = getTotalDuration(data.album);
    const imageURLs: SpotifyImage[] = data.album.images;
    const image = imageURLs[0].url;
    let colors: ExtractedColor[] = [];
    if (data.colors) {
      colors = data.colors;
    } else {
      try {
        // Extract colors from the image
        colors = await getImageColors(image);
      } catch (error) {
        console.error("Failed to extract colors:", error);
      }
    }
    // Create the album
    const album = await db
      .insert(reviewedAlbums)
      .values({
        name: data.album.name,
        spotifyID: data.album.id,
        releaseDate: releaseDate,
        releaseYear: year,
        imageURLs: data.album.images,
        // scoredTracks: JSON.stringify(tracks),
        bestSong: data.bestSong,
        worstSong: data.worstSong,
        runtime: runtime,
        reviewContent: data.reviewContent,
        reviewScore: roundedScore,
        artistSpotifyID: createdArtist ? createdArtist.spotifyID : artist.spotifyID,
        artistName: createdArtist ? createdArtist.name : artist.name,
        colors: colors.map((color) => ({ hex: color.hex } as ExtractedColor)),
        genres: data.genres,
      })
      .returning()
      .then((results) => results[0]);

    // Create the tracks
    for (const track of tracks) {
      const trackData = data.album.tracks.items.find((item) => {
        return item.id === track.spotifyID;
      });

      if (trackData) {
        const trackAlbum = await db
          .select()
          .from(reviewedAlbums)
          .where(eq(reviewedAlbums.spotifyID, data.album.id))
          .then((results) => results[0]);

        const trackArtist = await db
          .select()
          .from(reviewedArtists)
          .where(eq(reviewedArtists.spotifyID, trackAlbum.artistSpotifyID))
          .then((results) => results[0]);

        const trackAlbumID = trackAlbum.spotifyID;
        const trackArtistID = trackArtist.spotifyID;

        const trackFeatures = trackData.artists
          .filter((artist) => artist.id !== trackArtist.spotifyID)
          .map((artist) => ({
            id: artist.id,
            name: artist.name,
          }));

        const createdTrack = await db
          .insert(reviewedTracks)
          .values({
            artistSpotifyID: trackArtistID,
            artistName: trackArtist.name,
            albumSpotifyID: trackAlbumID,
            name: trackData.name,
            spotifyID: trackData.id,
            features: trackFeatures,
            duration: trackData.duration_ms,
            // Same as before, this will always have a value
            rating: track.rating!,
          })
          .returning()
          .then((results) => results[0]);
      }
    }

    // If the artist already exists, calculate the new score and update the artist
    // The new album needs to be included in the calculation, so we update the artist after creating it
    if (artist) {
      const artistAlbums: ReviewedAlbum[] = await db
        .select()
        .from(reviewedAlbums)
        .where(eq(reviewedAlbums.artistSpotifyID, artist.spotifyID))
        .then((results) => results);

      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(artistAlbums, roundedScore);

      const updatedArtist = await db
        .update(reviewedArtists)
        .set({ averageScore: newAverageScore, bonusPoints: newBonusPoints, totalScore, bonusReason: JSON.stringify(bonusReasons) })
        .where(eq(reviewedArtists.spotifyID, artist.spotifyID))
        .then((result) => result);
    }

    // get all artists and order by total score desc
    const artists = await db
      .select()
      .from(reviewedArtists)
      .orderBy(desc(reviewedArtists.totalScore))
      .then((results) => results);

    let leaderboardPosition = 1;
    for (const artist of artists) {
      await db
        .update(reviewedArtists)
        .set({ leaderboardPosition })
        .where(eq(reviewedArtists.id, artist.id))
        .then((result) => result);
      leaderboardPosition++;
    }

    return album;
  }

  static async getAlbumByID(id: string) {
    const album: ReviewedAlbum = await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, id))
      .then((results) => results[0]);

    const artist: ReviewedArtist = await db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, album.artistSpotifyID))
      .then((results) => results[0]);

    const tracks: ReviewedTrack[] = await db
      .select()
      .from(reviewedTracks)
      .where(eq(reviewedTracks.albumSpotifyID, id))
      .then((results) => results);

    const displayTracks: DisplayTrack[] = tracks.map((track) => {
      return {
        name: track.name,
        artistName: track.artistName,
        artistSpotifyID: track.artistSpotifyID,
        spotifyID: track.spotifyID,
        duration: track.duration,
        rating: track.rating,
        features: track.features,
      };
    });

    return { album, artist, tracks: displayTracks };
  }

  static async getAllAlbums() {
    const albums = await db.select().from(reviewedAlbums);

    const displayAlbums: DisplayAlbum[] = albums.map((album) => {
      return {
        name: album.name,
        spotifyID: album.spotifyID,
        imageURLs: album.imageURLs,
        reviewScore: album.reviewScore,
        artistName: album.artistName,
        artistSpotifyID: album.artistSpotifyID,
        releaseYear: album.releaseYear,
      };
    });
    const numArtists = await db.select({ count: count() }).from(reviewedArtists);
    const numAlbums = await db.select({ count: count() }).from(reviewedAlbums);
    const numTracks = await db.select({ count: count() }).from(reviewedTracks);

    return { albums: displayAlbums, numArtists: numArtists[0].count, numAlbums: numAlbums[0].count, numTracks: numTracks[0].count };
  }

  static async getPaginatedAlbums({ page = 1, orderBy = "createdAt", order = "desc", search = "" }: GetAllAlbumsOptions) {
    // Validate sort params
    const validOrderBy = ["reviewScore", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;

    const sortField = validOrderBy.includes(orderBy) ? orderBy : "reviewScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";

    const PAGE_SIZE = 35;
    const OFFSET = (page - 1) * PAGE_SIZE;

    const baseQuery = db
      .select()
      .from(reviewedAlbums)
      .limit(PAGE_SIZE + 1) // Fetch one extra to check for further pages
      .offset(OFFSET)
      .orderBy(sortDirection === "asc" ? asc(reviewedAlbums[sortField]) : desc(reviewedAlbums[sortField]));

    // If a search string exists, apply WHERE
    const albums = search.trim() ? await baseQuery.where(or(ilike(reviewedAlbums.name, `%${search}%`), ilike(reviewedAlbums.artistName, `%${search}%`))) : await baseQuery;

    // Check if there are further pages
    const furtherPages = albums.length > PAGE_SIZE;

    // Trim the extra album if it exists
    if (furtherPages) {
      albums.pop();
    }

    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      reviewScore: album.reviewScore,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
    }));

    return { albums: displayAlbums, furtherPages };
  }

  static async deleteAlbum(id: string) {
    const album = await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, id))
      .then((results) => results[0]);

    if (!album) {
      throw new Error("Album not found");
    }

    await db.delete(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, id));
    await db.delete(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, id));
  }

  static async updateAlbumReview(data: ReceivedReviewData, albumID: string) {
    // Check if the data is a ReviewedAlbum
    if (!("reviewScore" in data.album && "artistName" in data.album)) {
      throw new Error("Invalid album data: Expected a ReviewedAlbum, received something else");
    }

    // Fetch existing album
    const existingAlbum = await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, albumID))
      .then((results) => results[0]);

    if (!existingAlbum) {
      throw new Error("Album not found");
    }

    // Fetch existing tracks for this album
    const existingTracks = await db
      .select()
      .from(reviewedTracks)
      .where(eq(reviewedTracks.albumSpotifyID, albumID))
      .then((results) => results);

    // Track fields that have changed
    let updateNeeded = false;
    let updateValues: Partial<typeof reviewedAlbums.$inferInsert> = {};

    if (data.reviewContent !== existingAlbum.reviewContent) {
      updateValues.reviewContent = data.reviewContent;
      updateNeeded = true;
      console.log("reviewContent changed");
    }

    if (data.bestSong !== existingAlbum.bestSong) {
      updateValues.bestSong = data.bestSong;
      updateNeeded = true;
      console.log("bestSong changed");
    }

    if (data.worstSong !== existingAlbum.worstSong) {
      updateValues.worstSong = data.worstSong;
      updateNeeded = true;
      console.log("worstSong changed");
    }

    if (JSON.stringify(data.genres) !== JSON.stringify(existingAlbum.genres)) {
      updateValues.genres = data.genres;
      updateNeeded = true;
      console.log("genres changed");
    }

    if (JSON.stringify(data.colors) !== JSON.stringify(existingAlbum.colors)) {
      updateValues.colors = data.colors;
      updateNeeded = true;
      console.log("colors changed");
    }

    // Check if ratedTracks have changed
    const tracksChanged = data.ratedTracks.some((newTrack) => {
      const oldTrack = existingTracks.find((track) => track.spotifyID === newTrack.spotifyID);
      return !oldTrack || oldTrack.rating !== newTrack.rating;
    });

    if (tracksChanged) {
      const newScore = calculateAlbumScore(data.ratedTracks);
      if (newScore !== existingAlbum.reviewScore) {
        updateValues.reviewScore = newScore;
        updateNeeded = true;
      }
    }

    // Update album only if necessary
    if (updateNeeded) {
      await db.update(reviewedAlbums).set(updateValues).where(eq(reviewedAlbums.spotifyID, albumID));
    }

    // Update `reviewedTracks` if there are changes
    if (tracksChanged) {
      for (const newTrack of data.ratedTracks) {
        const existingTrack = existingTracks.find((track) => track.spotifyID === newTrack.spotifyID);

        if (!existingTrack) {
          // Insert new track
          await db.insert(reviewedTracks).values({
            artistSpotifyID: existingAlbum.artistSpotifyID,
            artistName: existingAlbum.artistName,
            albumSpotifyID: albumID,
            name: newTrack.name,
            spotifyID: newTrack.spotifyID,
            features: newTrack.features,
            duration: newTrack.duration,
            rating: newTrack.rating ?? 0, // Provide a default value if undefined
          });
        } else if (existingTrack.rating !== newTrack.rating) {
          // Update only if rating changed
          await db.update(reviewedTracks).set({ rating: newTrack.rating }).where(eq(reviewedTracks.spotifyID, newTrack.spotifyID));
        }
      }
    }

    // Only recalculate album score if tracks changed
    if (tracksChanged) {
      const newAlbumScore = calculateAlbumScore(data.ratedTracks);
      await db.update(reviewedAlbums).set({ reviewScore: newAlbumScore }).where(eq(reviewedAlbums.spotifyID, albumID));

      // Update artist's score
      const artistAlbums = await db
        .select()
        .from(reviewedAlbums)
        .where(eq(reviewedAlbums.artistSpotifyID, existingAlbum.artistSpotifyID))
        .then((results) => results);

      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(artistAlbums, newAlbumScore);

      await db
        .update(reviewedArtists)
        .set({
          averageScore: newAverageScore,
          bonusPoints: newBonusPoints,
          totalScore,
          bonusReason: JSON.stringify(bonusReasons),
        })
        .where(eq(reviewedArtists.spotifyID, existingAlbum.artistSpotifyID));
    }

    return await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, albumID))
      .then((results) => results[0]);
  }
}
