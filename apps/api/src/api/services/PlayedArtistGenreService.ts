import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { GenreModel } from "@/api/models/Genre";
import { matchGenres } from "@/helpers/matchGenres";
import type { JobEmit } from "@/api/services/JobService";

const MAX_ARTISTS_PER_RUN = 1000;
/** A tag counts when listeners use it at least a quarter as often as the artist's top tag */
const MIN_TAG_COUNT = 25;
const MAX_GENRES_PER_ARTIST = 3;

export const PlayedArtistGenreService = {
  /**
   * Gives each played artist up to 3 genres from the genre list, from the tags Last.fm listeners use most for them.
   * Tags that match no genre are ignored. Looks up at most 1000 artists a run, and only artists not looked up before.
   * An artist that fails is tried again next run. Last.fm's rate limit stops the run.
   */
  async lookUpGenres(emit: JobEmit): Promise<void> {
    const [artists, genres] = await Promise.all([PlayedTrackModel.getArtistsWithoutGenres(MAX_ARTISTS_PER_RUN), GenreModel.getAllGenres()]);
    const genreIDsByName = new Map(genres.map(genre => [genre.name, genre.id]));

    for (const [index, artist] of artists.entries()) {
      const progress = { index: index + 1, total: artists.length, spotifyID: artist.spotifyID, artistName: artist.name };
      emit("progress", progress);
      try {
        const tags = (await LastFmClient.getTopTags(artist.name)) ?? [];
        const tagNames = tags.filter(tag => tag.count >= MIN_TAG_COUNT).map(tag => tag.name);
        const genreIDs: number[] = [];
        for (const suggestion of matchGenres(tagNames, [...genreIDsByName.keys()])) {
          const genreID = genreIDsByName.get(suggestion.name);
          if (genreID !== undefined && genreIDs.length < MAX_GENRES_PER_ARTIST) genreIDs.push(genreID);
        }
        await PlayedTrackModel.saveGenres(artist.spotifyID, genreIDs);
        emit(genreIDs.length > 0 ? "changed" : "same", progress);
      } catch (error) {
        if (error instanceof LastFmLimitError) throw error;
        emit("failed", { ...progress, message: (error as Error).message });
      }
    }
  },
};
