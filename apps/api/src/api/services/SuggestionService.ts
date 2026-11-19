import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { SuggestedAlbumModel, type NewSuggestedAlbum } from "@/api/models/SuggestedAlbum";
import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";
import { ListenerLinkModel } from "@/api/models/ListenerLink";
import { isLiveReissueOrSoundtrack, isNewStudioAlbum, parseReleaseDate } from "@/helpers/newAlbums";
import { normaliseArtistName } from "@/helpers/artistName";
import { rankPickedArtists } from "@/helpers/pickedArtists";
import type { JobEmit } from "@/api/services/JobService";

/** How many albums the Picked for you row holds */
const PICK_LIMIT = 10;
/** How many of the ranked artists the picks try before they stop, so a run makes a bounded number of calls */
const MAX_ARTISTS_TRIED = 30;
/** How many of an artist's most played albums the picks try on Spotify */
const MAX_ALBUMS_TRIED = 5;

interface RankedAlbum {
  album: NewSuggestedAlbum;
  artistAverage: number;
}

/** Fills the rows on the Review an album page that the Album suggestions job keeps. */
export const SuggestionService = {
  /** Refreshes the new albums row and then the Picked for you row. */
  async refreshSuggestions(emit: JobEmit): Promise<void> {
    await this.refreshNewAlbums(emit);
    await this.refreshPicks();
  },

  /**
   * Finds the new studio albums by every reviewed artist on Spotify and saves them as the "new" row,
   * best artist average first, then newest first. Albums already reviewed or bookmarked are left out.
   * An artist whose albums can't be fetched keeps their albums from the last run, and is reported through `emit`.
   */
  async refreshNewAlbums(emit: JobEmit, now: Date = new Date()): Promise<void> {
    const [artists, takenAlbumIDs, previous] = await Promise.all([SuggestedAlbumModel.getArtistsWithAverage(), SuggestedAlbumModel.getTakenAlbumIDs(), SuggestedAlbumModel.getAll("new")]);
    const accessToken = await SpotifyTokenCache.getAccessToken();
    const found: RankedAlbum[] = [];

    for (const [index, artist] of artists.entries()) {
      const progress = { index: index + 1, total: artists.length, spotifyID: artist.spotifyID, artistName: artist.name, artistImage: artist.imageURLs[0]?.url };
      emit("progress", progress);
      try {
        const albums = await SpotifyClient.getArtistAlbums(artist.spotifyID, accessToken);
        const newAlbums = albums.filter(album => !takenAlbumIDs.has(album.id) && isNewStudioAlbum({ name: album.name, releaseDate: album.release_date }, now));
        for (const album of newAlbums) {
          found.push({
            artistAverage: artist.averageScore,
            album: {
              spotifyID: album.id,
              name: album.name,
              artistName: album.artists[0].name,
              artistSpotifyID: album.artists[0].id,
              imageURLs: album.images,
              releaseDate: album.release_date,
              releaseYear: parseReleaseDate(album.release_date).getUTCFullYear(),
            },
          });
        }
        emit(newAlbums.length > 0 ? "changed" : "same", progress);
      } catch (error) {
        const kept = previous.filter(album => album.artistSpotifyID === artist.spotifyID && !takenAlbumIDs.has(album.spotifyID));
        for (const album of kept) found.push({ artistAverage: artist.averageScore, album });
        emit("failed", { ...progress, message: (error as Error).message });
      }
    }

    const ranked = found.sort((a, b) => b.artistAverage - a.artistAverage || parseReleaseDate(b.album.releaseDate).getTime() - parseReleaseDate(a.album.releaseDate).getTime());
    // An album by two reviewed artists turns up once for each of them
    const albums = new Map<string, NewSuggestedAlbum>();
    for (const entry of ranked) {
      if (!albums.has(entry.album.spotifyID)) albums.set(entry.album.spotifyID, entry.album);
    }
    await SuggestedAlbumModel.replaceRow("new", [...albums.values()]);
  },

  /**
   * Picks up to 10 albums by artists not yet reviewed, from the artists that listeners link to the highest-rated artists,
   * and saves them as the "picked" row. Each artist gives their most played studio album on Last.fm that Spotify lists as an album.
   * An artist whose album can't be found or fetched is skipped.
   * @throws When Last.fm refuses more requests, or when every artist failed, and the saved row stays.
   */
  async refreshPicks(): Promise<void> {
    const [artists, overallAverage, reviewedArtists, takenAlbumIDs] = await Promise.all([
      SuggestedAlbumModel.getArtistsWithAverage(),
      SuggestedAlbumModel.getOverallAverage(),
      ListenerLinkModel.getAllArtists(),
      SuggestedAlbumModel.getTakenAlbumIDs(),
    ]);
    const links = await ListenerLinkModel.getLinks(artists.map(artist => artist.spotifyID));
    const ranked = rankPickedArtists(
      artists,
      links,
      overallAverage,
      reviewedArtists.map(artist => artist.name)
    );
    const accessToken = await SpotifyTokenCache.getAccessToken();

    const picks: NewSuggestedAlbum[] = [];
    let lastError: unknown = null;
    for (const candidate of ranked.slice(0, MAX_ARTISTS_TRIED)) {
      if (picks.length === PICK_LIMIT) break;
      try {
        const pick = await this.findPickedAlbum(candidate.name, takenAlbumIDs, accessToken);
        if (pick) picks.push(pick);
      } catch (error) {
        if (error instanceof LastFmLimitError) throw error;
        lastError = error;
      }
    }
    if (picks.length === 0 && lastError !== null) throw lastError;
    await SuggestedAlbumModel.replaceRow("picked", picks);
  },

  /**
   * Finds an artist's most played studio album on Last.fm, then the same album on Spotify by its title and the artist's name.
   * @returns The album, or null when none of the artist's most played albums is a studio album on Spotify that isn't taken.
   */
  async findPickedAlbum(artistName: string, takenAlbumIDs: Set<string>, accessToken: string): Promise<NewSuggestedAlbum | null> {
    const topAlbums = (await LastFmClient.getTopAlbums(artistName)) ?? [];
    const titles = topAlbums.map(album => album.name).filter(title => !isLiveReissueOrSoundtrack(title));
    const wantedArtist = normaliseArtistName(artistName);

    for (const title of titles.slice(0, MAX_ALBUMS_TRIED)) {
      const results = await SpotifyClient.searchAlbums(`album:"${title}" artist:"${artistName}"`, 0, accessToken);
      const match = results.albums.items.find(album => album.album_type === "album" && normaliseArtistName(album.artists[0].name) === wantedArtist && !isLiveReissueOrSoundtrack(album.name));
      if (!match) continue;
      if (takenAlbumIDs.has(match.id)) return null;
      return {
        spotifyID: match.id,
        name: match.name,
        artistName: match.artists[0].name,
        artistSpotifyID: match.artists[0].id,
        imageURLs: match.images,
        releaseDate: match.release_date,
        releaseYear: parseReleaseDate(match.release_date).getUTCFullYear(),
      };
    }
    return null;
  },
};
