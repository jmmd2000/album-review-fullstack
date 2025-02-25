import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { desc, eq } from "drizzle-orm";
import { ReviewedAlbum } from "@shared/types";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "../../db/schema";
import { ReceivedReviewData } from "../controllers/albumController";
import getTotalDuration from "../../helpers/formatDuration";
import formatDate from "../../helpers/formatDate";
import { calculateArtistScore } from "../../helpers/calculateArtistScore";
import { fetchArtistFromSpotify } from "../../helpers/fetchArtistFromSpotify";
import { db } from "../../index";

export class Album {
  static async createAlbumReview(data: ReceivedReviewData) {
    const existingAlbum = await db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, data.album.id))
      .then((results) => results[0]);

    if (existingAlbum) {
      throw new Error("Album already exists");
    }

    let albumScore = 0;
    // Remove any tracks with a rating of 0
    // const tracks = data.ratedTracks.filter((track) => track.rating !== 0);

    // Add up all the ratings
    const tracks = data.ratedTracks;
    tracks.forEach((track) => {
      albumScore += parseInt(track.rating.toString());
    });
    const maxScore = tracks.length * 10;
    const percentageScore = (albumScore / maxScore) * 100;

    // Round to 0 decimal places
    const roundedScore = Math.round(percentageScore);
    // console.log({ albumScore, maxScore, percentageScore, roundedScore, tracks });

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
            imageURLs: fetchedArtist.imageURLs.join(","),
            averageScore: roundedScore,
            leaderboardPosition: 0,
          })
          .returning()
          .then((results) => results[0]);

        // console.log({ createdArtist });
      }
    }

    const date = new Date(data.album.release_date);
    const year = date.getFullYear();
    const releaseDate = formatDate(data.album.release_date);
    const runtime = getTotalDuration(data.album);

    // Create the album
    const album = await db
      .insert(reviewedAlbums)
      .values({
        name: data.album.name,
        spotifyID: data.album.id,
        releaseDate: releaseDate,
        releaseYear: year,
        imageURLs: JSON.stringify(data.album.images),
        scoredTracks: JSON.stringify(tracks),
        bestSong: data.bestSong,
        worstSong: data.worstSong,
        runtime: runtime,
        reviewContent: data.reviewContent,
        reviewScore: roundedScore,
        artistDBID: createdArtist ? createdArtist.id : artist.id,
        reviewDate: new Date().toISOString(),
      })
      .returning()
      .then((results) => results[0]);

    // console.log("album created");
    // console.log({ album });

    // Create the tracks
    for (const track of tracks) {
      const trackData = data.album.tracks.items.find((item) => item.id === track.id);
      if (trackData) {
        const trackAlbum = await db
          .select()
          .from(reviewedAlbums)
          .where(eq(reviewedAlbums.spotifyID, data.album.id))
          .then((results) => results[0]);

        const trackArtist = await db
          .select()
          .from(reviewedArtists)
          .where(eq(reviewedArtists.id, trackAlbum.artistDBID))
          .then((results) => results[0]);

        const trackAlbumID = trackAlbum.id;
        const trackArtistID = trackArtist.id;

        const trackFeatures = trackData.artists
          .filter((artist) => artist.id !== trackArtist.spotifyID)
          .map((artist) => ({
            id: artist.id,
            name: artist.name,
          }));

        const createdTrack = await db
          .insert(reviewedTracks)
          .values({
            artistDBID: trackArtistID,
            albumDBID: trackAlbumID,
            name: trackData.name,
            spotifyID: trackData.id,
            features: JSON.stringify(trackFeatures),
            duration: trackData.duration_ms,
            rating: track.rating,
          })
          .returning()
          .then((results) => results[0]);
      }
    }

    // If the artist already exists, calculate the new score and update the artist
    // The new album needs to be included in the calculation, so we update the artist after creating it
    if (artist) {
      console.log("Artist found, updating score");
      const artistAlbums: ReviewedAlbum[] = await db
        .select()
        .from(reviewedAlbums)
        .where(eq(reviewedAlbums.artistDBID, artist.id))
        .then((results) => results as ReviewedAlbum[]);

      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(artistAlbums, roundedScore);

      const updatedArtist = await db
        .update(reviewedArtists)
        .set({ averageScore: newAverageScore, bonusPoints: newBonusPoints, totalScore, bonusReason: JSON.stringify(bonusReasons) })
        .where(eq(reviewedArtists.id, artist.id))
        .then((result) => result);

      console.log({ updatedArtist });
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
    const album = await db
      .select()
      .from(reviewedAlbums)
      .innerJoin(reviewedArtists, eq(reviewedAlbums.artistDBID, reviewedArtists.id))
      .where(eq(reviewedAlbums.spotifyID, id))
      .then((results) => results[0]);
    console.log({ album });
    return album;
  }

  static async getAllAlbums() {
    const albums = await db
      .select()
      .from(reviewedAlbums)
      // .innerJoin(reviewedArtists, eq(reviewedAlbums.artistDBID, reviewedArtists.id))
      .then((results) => results);
    return albums;
  }
}
