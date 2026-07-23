import type { CapturedAlbum } from "../../api/src/db/fixtures/captured";

// Rebuilds what the api's spotify proxy would return for the create page,
// using the checked in fixture, so the browser call never leaves the app.
export function buildSpotifyAlbumResponse(album: CapturedAlbum) {
  const artists = album.artists.map(artist => ({ spotifyID: artist.spotifyID, name: artist.name, imageURLs: artist.imageURLs }));

  return {
    album: {
      id: album.spotifyID,
      uri: album.uri,
      name: album.name,
      release_date: album.rawReleaseDate,
      images: album.imageURLs,
      colors: album.colors,
      artists: album.artists.map(artist => ({ id: artist.spotifyID, name: artist.name })),
      albumArtists: artists,
      tracks: {
        items: album.tracks.map(track => ({
          id: track.spotifyID,
          name: track.name,
          duration_ms: track.duration,
          artists: [{ id: track.artistSpotifyID, name: track.artistName }, ...track.features.map(feature => ({ id: feature.id, name: feature.name }))],
        })),
      },
    },
    artists,
    genres: [],
  };
}
