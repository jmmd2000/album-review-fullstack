import { SpotifyAlbum } from "@shared/types";

const ALBUM_IDS = [
  "7fRrTyKvE4Skh93v97gtcU",
  "0S0KGZnfBGSIssfF54WSJh",
  "0JGOiO34nwfUdDrD612dOp",
  // "7aJuG4TFXa2hmE4z1yxc3n",
  // "0EiI8ylL0FmWWpgHVTsZjZ",
  // "5s0rmjP8XOPhP6HhqOhuyC",
  // "6trNtQUgC8cgbWcqoMYkOR",
  // "4g1ZRSobMefqF6nelkgibi",
  // "3HHNR44YbP7XogMVwzbodx",
  // "1F9LY06gadScF4g3g3BrDC",
  // "4f2G7uAWqzpOPwEfCDV87A",
  // "2lIZef4lzdvZkiiCzvPKj7",
  // "4HTy9WFTYooRjE9giTmzAF",
  // "0Ydm84ftyiWRGOIFkdl30L",
  // "5lKlFlReHOLShQKyRv6AL9",
  // "1uROBP2G4MP0O4w1v5Cpbg",
  // "1qMFjBarjO2xD15BwXZguD",
  // "04E0aLUdCHnhnnYrDDvcHq",
  // "4o3RJndRhHxkieQzQGhmbw",
  // "4piJq7R3gjUOxnYs6lDCTg",
  // "1nAQbHeOWTfQzbOoFrvndW",
  // "2ODvWsOgouMbaA5xf0RkJe",
  // "1vL2mgGTukkrUxXt0loeTN",
  // "6tkjU4Umpo79wwkgPMV3nZ",
  // "392p3shh2jkxUxY2VHvlH8",
  // "0AP5O47kJWlaKVnnybKvQI",
  // "0RHX9XECH8IVI3LNgWDpmQ",
  // "4AueWk2dGXqbMFx7ogEAs7",
  // "3dcenoRctm8OAnqoCrQrLd",
  // "4NtamseeVOGesCm8W9oHSz",
  // "7lpVrkFA2XivBC5cis1dil",
  // "5MfAxS5zz8MlfROjGQVXhy",
  // "3U8n8LzBx2o9gYXvvNq4uH",
  // "2JdjS6jjOml7nt7Yjo0nnh",
  // "5r36AJ6VOJtp00oxSkBZ5h",
  // "7iOAJaGBmk67o337zaqt0R",
  // "55huyEjfSVsk9nnmmKp5df",
  // "1ORxRsK3MrSLvh7VQTF01F",
  // "4FyGpObwABjn0o8Tdp7AZz",
  // "6DmPNcfpkXBVRJsEIJY9tl",
  // "0rmhjUgoVa17LZuS8xWQ3v",
  // "6s84u2TUpR3wdUv4NgKA2j",
  // "2dqn5yOQWdyGwOpOIi9O4x",
  // "6czdbbMtGbAkZ6ud2OMTcg",
  // "7xV2TzoaVc0ycW7fwBwAml",
  // "4E7bV0pzG0LciBSWTszra6",
  // "2vlhlrgMaXqcnhRqIEV9AP",
  // "59ULskOkBMij4zL8pS7mi0",
  // "72ZfMxLCPG8mlWC0TXfZQi",
  // "3bvS3DlTwV35j2qwFhDvxx",
  // "7CwQcswdSnPsSwQtskEmT4",
  // "7mzrIsaAjnXihW3InKjlC3",
  // "1uyf3l2d4XYwiEqAb7t7fX",
  // "1JnjcAIKQ9TSJFVFierTB8",
  // "664z6KAZKVhAY36vBCLmiN",
  // "097eYvf9NKjFnv4xA9s2oV",
  // "1FZKIm3JVDCxTchXDo5jOV",
  // "6ZG5lRT77aJ3btmArcykra",
  // "2WFFcvzM0CgLaSq4MSkyZk",
  // "3T4tUhGYeRNVUGevb0wThu",
  // "1xn54DMo2qIqBuMqHtUsFd",
  // "32iAEBstCjauDhyKpGjTuq",
  // "0P3oVJBFOv3TDXlYRhGL7s",
  // "3n5Coa56i6foIGITrYGX7o",
  // "0Ug5scDXUIgGN8yanDBLQw",
  // "2wiPF3m0ylst0JSk1IvZL8",
  // "6n9DKpOxwifT5hOXtgLZSL",
  // "1btu0SV2DOI5HoFsvUd78F",
];

const REVIEW = {
  reviewContent:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sit amet urna a odio volutpat fringilla. Curabitur in augue quis mi dignissim posuere sed eget urna. Aenean tempus lacus at lacus auctor ultrices. Nullam sem erat, posuere sed blandit et, tristique ac ex. Donec ornare malesuada fermentum. Praesent accumsan est eget eros porttitor ornare. Proin sodales semper odio ac porttitor. Nunc scelerisque nunc eget sagittis vulputate. Nulla neque nunc, placerat sed laoreet ut, lobortis et orci. Fusce rutrum risus nec vestibulum pellentesque. Vestibulum mi libero, mattis in mi ac, lacinia dictum nulla. Nullam nisi odio, pharetra vitae interdum ac, lobortis in dui. Fusce convallis mattis risus id efficitur. In elementum, lorem eu eleifend sagittis, ligula arcu mattis nisl, vitae sodales dolor sem vestibulum mauris. Etiam elementum, libero vel semper suscipit, lacus purus ullamcorper leo, id scelerisque est nisi quis nulla. Nullam in consectetur dui, eget congue sapien. Curabitur lobortis diam eu pellentesque vulputate. Pellentesque varius id risus dictum dictum. Sed suscipit turpis massa, tristique consectetur dolor pellentesque sodales. Mauris eleifend suscipit iaculis. In suscipit at libero eget pellentesque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec vestibulum ex nulla, sed rutrum enim convallis at.",
};

const GENRES = ["pop", "rock", "rap", "hip-hop", "r&b", "jazz", "blues", "country", "classical", "metal", "electronic", "reggae", "folk", "indie", "punk", "hip-hop/rap", "r&b/soul", "pop/rap"];

export const seed = async (spotifyIDs: string[], review: { reviewContent: string }, logging: boolean = false) => {
  let albums: SpotifyAlbum[] = [];
  while (spotifyIDs.length > 0) {
    const randomIndex = Math.floor(Math.random() * spotifyIDs.length);
    const id = spotifyIDs.splice(randomIndex, 1)[0];
    if (logging) console.log(`\x1b[34mSeed:\x1b[0m Fetching album with id \x1b[33m${id}\x1b[0m`);
    const response = await fetch(`http://localhost:4000/api/spotify/albums/${id}?includeGenres=false`);
    console.log(response);
    const data: SpotifyAlbum = await response.json();
    console.log(data);
    albums.push(data);
    if (logging) console.log(`\x1b[34mSeed:\x1b[0m Fetched album \x1b[33m${data.name}\x1b[0m`);
  }

  let reviewedAlbums = albums.map((album) => {
    if (logging) console.log(`\x1b[34mSeed:\x1b[0m Reviewing album \x1b[33m${album.name}\x1b[0m`);
    const bestSong = album.tracks.items[Math.floor(Math.random() * album.tracks.items.length)].name;
    const worstSong = album.tracks.items[Math.floor(Math.random() * album.tracks.items.length)].name;
    const randomGenres = Array.from({ length: 3 }, () => GENRES[Math.floor(Math.random() * GENRES.length)]);
    return {
      ...review,
      bestSong: bestSong,
      worstSong: worstSong,
      genres: randomGenres,
      album,
      ratedTracks: album.tracks.items.map((track) => {
        return {
          spotifyID: track.id,
          rating: Math.floor(Math.random() * 10) + 1,
        };
      }),
    };
  });

  for (let reviewedAlbum of reviewedAlbums) {
    if (logging) console.log(`\x1b[34mSeed:\x1b[0m Creating review for album \x1b[33m${reviewedAlbum.album.name}\x1b[0m`);
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
        if (logging) console.log(`\x1b[34mSeed:\x1b[0m \x1b[31m${error.message}\x1b[0m`);
      } else {
        if (logging) console.log(`\x1b[34mSeed:\x1b[0m \x1b[31mAn unknown error occurred.\x1b[0m`);
      }
    }
  }

  console.log(`\x1b[34mSeed:\x1b[0m \x1b[32mSeeding complete.\x1b[0m`);
};

// Disable this call when running tests
seed(ALBUM_IDS, REVIEW, true);
