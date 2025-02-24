import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { MinimalAlbum, Reason, ReviewedAlbum, SpotifyAlbum, SpotifyArtist, SpotifyImage } from "../../../types";
import { reviewedAlbums, reviewedArtists } from "../../db/schema";
import { ReceivedReviewData } from "../controllers/albumController";
import { SpotifyService } from "../services/spotifyService";

const db = drizzle(process.env.DATABASE_URL!);

export class Album {
  static async createAlbumReview(data: ReceivedReviewData) {
    console.log(data);

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
    console.log({ albumScore, maxScore, percentageScore, roundedScore, tracks });

    // See if the artist already exists
    const artist = await db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, data.album.artists[0].id))
      .then((results) => results[0]);

    let createdArtist = null;

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

        console.log({ createdArtist });
      }
    }

    if (artist) {
      const artistAlbums = await db
        .select()
        .from(reviewedAlbums)
        .where(eq(reviewedAlbums.artistDBID, artist.id))
        .then((results) => results);

      const { newAverageScore, newBonusPoints, totalScore, bonusReasons } = calculateArtistScore(artistAlbums as ReviewedAlbum[], roundedScore);

      const updatedArtist = await db
        .update(reviewedArtists)
        .set({ averageScore: newAverageScore, bonusPoints: newBonusPoints, totalScore, bonusReason: JSON.stringify(bonusReasons) })
        .where(eq(reviewedArtists.id, artist.id))
        .then((result) => result);

      console.log({ updatedArtist });
    }

    const date = new Date(data.album.release_date);
    const year = date.getFullYear();

    const album = await db
      .insert(reviewedAlbums)
      .values({
        name: data.album.name,
        spotifyID: data.album.id,
        releaseDate: formatDate(data.album.release_date),
        releaseYear: year,
        imageURLs: data.album.images.map((image) => image.url).join(","),
        scoredTracks: JSON.stringify(tracks),
        bestSong: data.bestSong,
        worstSong: data.worstSong,
        runtime: getTotalDuration(data.album),
        reviewContent: data.reviewContent,
        reviewScore: roundedScore,
        artistDBID: createdArtist ? createdArtist.id : artist.id,
        reviewDate: new Date().toISOString(),
      })
      .returning()
      .then((results) => results[0]);

    console.log({ album });

    //-TODO:
    //# Leaderboard position
    //# Images are wrong format
    //# Testing
    //# Put helpers in separate files

    return album;

    // const artist = await db
    //   .select()
    //   .from(reviewedArtists)
    //   .where(eq(reviewedArtists.id, album.artistDBID))
    //   .then((results) => results[0]);

    // if (!artist) {
    //   throw new Error("Artist not found");
    // }

    // const existingAlbum = await db
    //   .select()
    //   .from(reviewedAlbums)
    //   .where(eq(reviewedAlbums.spotifyID, album.spotifyID))
    //   .then((results) => results[0]);

    // if (existingAlbum) {
    //   throw new Error("Album already exists");
    // }

    // return db
    //   .insert(reviewedAlbums)
    //   .values(album)
    //   .returning()
    //   .then((results) => results[0]);
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
}

type ArtistData = {
  name: string;
  spotifyID: string;
  imageURLs: string[];
};

const fetchArtistFromSpotify = async (id: string, url: string): Promise<ArtistData | null> => {
  const token = await SpotifyService.getAccessToken();
  const searchParameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(url, searchParameters);

  const artist = (await response.json()) as SpotifyArtist;

  return {
    name: artist.name,
    spotifyID: artist.id,
    imageURLs: artist.images.map((image) => image.url), // Extract URLs instead of JSON string
  };
};

//? This function takes an array of albums and calculates the artist's score.
//? If this is called while adding a new album, the array of albums doesn't include the new album yet, so it needs to be accounted for.
//* albums: AlbumReview[] - An array of albums to calculate the score for
//* existingScore: number | null - In the case that this is being called while adding a new album, this is the artist's current score

const GOOD_ALBUM_BONUS = 0.25;
const BAD_ALBUM_BONUS = 0.25;

export const calculateArtistScore = (albums: ReviewedAlbum[], existingScore: number | null) => {
  let newAverageScore = existingScore ?? 0;
  let newBonusPoints = 0;

  for (const album of albums) {
    newAverageScore += album.reviewScore;
  }

  const bonusReasons: Reason[] = [];

  if (albums.length > 2) {
    //* Calculate bonus points only for every album after the first 2
    //* Also generate the bonus reasons
    // const albumsToConsider = albums.slice(2);
    console.log("--------------------------Starting on albums ---------------------------------");
    for (const album of albums) {
      console.log(album.name);
      const image_urls = JSON.parse(album.imageURLs) as SpotifyImage[];
      const minimalAlbum: MinimalAlbum = {
        id: album.id,
        spotifyID: album.spotifyID,
        name: album.name,
        imageURLs: image_urls,
      };
      if (album.reviewScore < 45) {
        console.log("Low quality album");
        newBonusPoints -= BAD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Low quality album",
          value: -BAD_ALBUM_BONUS,
        });
      } else if (album.reviewScore > 45 && album.reviewScore < 55) {
        console.log("Mid quality album");
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Mid quality album",
          value: 0,
        });
      } else if (album.reviewScore > 55) {
        console.log("High quality album");
        newBonusPoints += GOOD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "High quality album",
          value: GOOD_ALBUM_BONUS,
        });
      }
    }
    console.log("--------------------------Finished on albums ---------------------------------");
    console.log({ newBonusPoints, bonusReasons });
  }

  //* If this is being called while adding a new album, the array of albums doesn't include the new album yet
  if (existingScore) {
    newAverageScore = newAverageScore / (albums.length + 1);
  } else {
    newAverageScore = newAverageScore / albums.length;
  }

  //* Calculate the total score
  let totalScore = newAverageScore + newBonusPoints;
  if (totalScore > 100) {
    totalScore = 100;
  }
  console.log({ newAverageScore, newBonusPoints, totalScore, bonusReasons });
  console.log("--------------------------recalculationcomplete ---------------------------------");

  return { newAverageScore, newBonusPoints, totalScore, bonusReasons };
};

export function formatDate(inputDate: string): string {
  //* Some release dates from spotify are just the year, so we need to check for that
  if (inputDate.length < 5) {
    return inputDate;
  } else {
    // Parse the input date string into a Date object
    const dateParts = inputDate.split("-").map(Number);
    const [year, month, day] = dateParts;
    const parsedDate = new Date(year!, month! - 1, day);

    // Format the date using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedDate = formatter.format(parsedDate);

    // Extract day and add the appropriate suffix (e.g., "1st", "2nd", "3rd", "4th")
    const dayOfMonth = parsedDate.getDate();
    let daySuffix = "th";

    if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31) {
      daySuffix = "st";
    } else if (dayOfMonth === 2 || dayOfMonth === 22) {
      daySuffix = "nd";
    } else if (dayOfMonth === 3 || dayOfMonth === 23) {
      daySuffix = "rd";
    }

    return `${formattedDate.replace(`${dayOfMonth}`, `${dayOfMonth}${daySuffix}`)}`;
  }
}

export function formatDuration(durationMs: number, form: string): string {
  if (form === "short") {
    const minutes = Math.floor(durationMs / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((durationMs % 60000) / 1000); // Remaining seconds

    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${formattedSeconds}`;
  } else if (form === "long") {
    const minutes = Math.floor(durationMs / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((durationMs % 60000) / 1000); // Remaining seconds

    const minuteText = minutes > 1 ? "minutes" : "minute";
    const secondText = seconds > 1 ? "seconds" : "second";

    if (minutes > 0 && seconds > 0) {
      return `${minutes} ${minuteText} ${seconds} ${secondText}`;
    } else if (minutes > 0) {
      return `${minutes} ${minuteText}`;
    } else {
      return `${seconds} ${secondText}`;
    }
  } else {
    throw new Error('Invalid form parameter. Use "long" or "short".');
  }
}

export function getTotalDuration(album: SpotifyAlbum): string {
  const totalDurationMs = album.tracks.items.reduce((acc, track) => acc + track.duration_ms, 0);
  return formatDuration(totalDurationMs, "long");
}
