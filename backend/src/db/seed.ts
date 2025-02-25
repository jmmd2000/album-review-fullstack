import { SpotifyAlbum } from "@shared/types";

const ALBUM_IDS = [
  "7fRrTyKvE4Skh93v97gtcU",
  "0S0KGZnfBGSIssfF54WSJh",
  "0JGOiO34nwfUdDrD612dOp",
  "7aJuG4TFXa2hmE4z1yxc3n",
  "0EiI8ylL0FmWWpgHVTsZjZ",
  "5s0rmjP8XOPhP6HhqOhuyC",
  "6trNtQUgC8cgbWcqoMYkOR",
  "4g1ZRSobMefqF6nelkgibi",
  "3HHNR44YbP7XogMVwzbodx",
  "1F9LY06gadScF4g3g3BrDC",
  "4BbsHmXEghoPPevQjPnHXx",
];

const REVIEW = {
  reviewContent: "Amazing album with deep emotions.",
  bestSong: "The Best Song",
  worstSong: "The Worst Song",
};

const seed = async () => {
  let albums: SpotifyAlbum[] = [];
  for (let id of ALBUM_IDS) {
    console.log(`\x1b[34mSeed:\x1b[0m Fetching album with id \x1b[33m${id}\x1b[0m`);
    const response = await fetch(`http://localhost:4000/api/spotify/albums/${id}`);
    const data: SpotifyAlbum = await response.json();
    albums.push(data);
  }

  let reviewedAlbums = albums.map((album) => {
    console.log(`\x1b[34mSeed:\x1b[0m Reviewing album \x1b[33m${album.name}\x1b[0m`);
    return {
      ...REVIEW,
      album,
      ratedTracks: album.tracks.items.map((track) => {
        return {
          id: track.id,
          rating: Math.floor(Math.random() * 6),
        };
      }),
    };
  });

  for (let reviewedAlbum of reviewedAlbums) {
    console.log(`\x1b[34mSeed:\x1b[0m Creating review for album \x1b[33m${reviewedAlbum.album.name}\x1b[0m`);
    try {
      const response = await fetch(`http://localhost:4000/api/albums/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewedAlbum),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(`\x1b[31m${error.message}\x1b[0m`);
      } else {
        console.log(`\x1b[31mAn unknown error occurred.\x1b[0m`);
      }
    }
  }

  console.log("\x1b[32mSeeding complete.\x1b[0m");
};

seed();
