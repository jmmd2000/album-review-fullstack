import "@/config/loadEnvironment";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import type { DisplayTrack } from "@shared/types";
import { resolveDatabaseURL } from "@/config/database";
import { db, closeDatabase } from "@/db/client";
import { assertSafeToWipe } from "@/db/databaseSafety";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { TrackModel } from "@/api/models/Track";
import { GenreModel } from "@/api/models/Genre";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { GenreService } from "@/api/services/GenreService";
import { ArtistScoreService } from "@/api/services/ArtistScoreService";
import { BOOKMARKED_IDS, REVIEW_CONTENT, REVIEWED, capturedAlbum, ratingFor } from "./fixtures/fixtures";

// Seeds the database directly from the checked-in fixture snapshot, no server,
// no network, and the same scores every run. Scores come from the same pure
// helpers the app uses, so seeded numbers track the real scoring logic.
const seed = async () => {
  assertSafeToWipe(resolveDatabaseURL());

  const existing = await AlbumModel.getAllAlbums();
  if (existing.length > 0) {
    throw new Error(`Seed: the database already has ${existing.length} reviewed albums, run db:wipe first`);
  }

  await db.transaction(async tx => {
    const createdArtistIDs = new Set<string>();

    for (const review of REVIEWED) {
      const captured = capturedAlbum(review.spotifyID);
      const albumArtistIDs = captured.artists.map(artist => artist.spotifyID);
      const excluded = new Set((review.scoreExcludedArtistIndexes ?? []).map(index => albumArtistIDs[index]));
      const scoreArtistIDs = review.affectsArtistScore ? albumArtistIDs.filter(id => !excluded.has(id)) : [];
      const primaryArtist = captured.artists[0];

      // Build the rated track list and score the album with the app's own scoring helper
      const ratedTracks: DisplayTrack[] = captured.tracks.map((track, index) => ({
        spotifyID: track.spotifyID,
        name: track.name,
        artistName: track.artistName,
        artistSpotifyID: track.artistSpotifyID,
        duration: track.duration,
        features: track.features.filter(feature => !albumArtistIDs.includes(feature.id)),
        rating: ratingFor(index, review.offset),
      }));
      const { baseScore, finalScore } = calculateAlbumScore(ratedTracks, 0);

      const byRating = [...ratedTracks].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      const bestTrackID = byRating[0].spotifyID;
      const worstTrackID = byRating[byRating.length - 1].spotifyID;

      // Artists start neutral; aggregates are computed once every album is in
      for (const artist of captured.artists) {
        if (createdArtistIDs.has(artist.spotifyID)) continue;
        await ArtistModel.createArtist(
          {
            name: artist.name,
            spotifyID: artist.spotifyID,
            imageURLs: artist.imageURLs,
            headerImage: null,
            totalScore: 0,
            reviewCount: 0,
            unrated: true,
            leaderboardPosition: null,
          },
          tx
        );
        createdArtistIDs.add(artist.spotifyID);
      }

      await AlbumModel.createAlbum(
        {
          name: captured.name,
          spotifyID: captured.spotifyID,
          releaseDate: captured.releaseDate,
          releaseYear: captured.releaseYear,
          imageURLs: captured.imageURLs,
          runtime: captured.runtime,
          reviewContent: REVIEW_CONTENT,
          reviewScore: baseScore,
          bonus: 0,
          finalScore,
          affectsArtistScore: scoreArtistIDs.length > 0,
          artistSpotifyID: primaryArtist.spotifyID,
          artistName: primaryArtist.name,
          colors: captured.colors,
          genres: review.genres,
          albumArtists: captured.artists.map(artist => ({ spotifyID: artist.spotifyID, name: artist.name, imageURLs: artist.imageURLs })),
        },
        tx
      );

      // Genres, links and related strengths through the same code the app uses
      const genreIDs: number[] = [];
      for (const name of review.genres) {
        genreIDs.push(await GenreService.findOrCreateGenre(name, tx));
      }
      await GenreModel.linkGenresToAlbum(captured.spotifyID, genreIDs, tx);
      await GenreModel.incrementRelatedStrength(genreIDs, tx);

      await AlbumModel.upsertAlbumArtists(
        captured.spotifyID,
        albumArtistIDs.map(artistSpotifyID => ({ artistSpotifyID, affectsScore: scoreArtistIDs.includes(artistSpotifyID) })),
        tx
      );

      for (const track of ratedTracks) {
        await TrackModel.createTrack(
          {
            albumSpotifyID: captured.spotifyID,
            artistSpotifyID: primaryArtist.spotifyID,
            artistName: primaryArtist.name,
            name: track.name,
            spotifyID: track.spotifyID,
            duration: track.duration,
            features: track.features,
            rating: track.rating!,
            pick: track.spotifyID === bestTrackID ? "best" : track.spotifyID === worstTrackID ? "worst" : null,
          },
          tx
        );
        const trackArtistIDs = [track.artistSpotifyID, ...track.features.map(feature => feature.id)].filter(id => createdArtistIDs.has(id));
        await TrackModel.linkArtistsToTrack(track.spotifyID, trackArtistIDs, tx);
      }

      console.log(`Seed: reviewed ${captured.name} (final score ${finalScore})`);
    }

    // Aggregate pass through the app's own artist scoring
    const scores = await ArtistScoreService.calculateScores([...createdArtistIDs], tx);
    for (const [artistID, fields] of scores) {
      await ArtistModel.updateArtist(artistID, fields, tx);
    }

    await ArtistScoreService.updateAllLeaderboardPositions(tx);
  });

  // Bookmarks sit outside the review graph
  for (const spotifyID of BOOKMARKED_IDS) {
    const captured = capturedAlbum(spotifyID);
    await BookmarkedAlbumModel.bookmarkAlbum({
      name: captured.name,
      spotifyID: captured.spotifyID,
      imageURLs: captured.imageURLs,
      artistName: captured.artists[0].name,
      artistSpotifyID: captured.artists[0].spotifyID,
      releaseYear: captured.releaseYear,
    });
    console.log(`Seed: bookmarked ${captured.name}`);
  }

  console.log(`Seed: done. ${REVIEWED.length} reviewed albums, ${BOOKMARKED_IDS.length} bookmarks.`);
  await closeDatabase();
};

seed();
