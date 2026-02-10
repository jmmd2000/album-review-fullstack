import { DisplayAlbum, DisplayArtist } from "@shared/types";

export const mockDisplayAlbum: DisplayAlbum = {
  spotifyID: "0JGOiO34nwfUdDrD612dOp",
  name: "Happier Than Ever",
  artistName: "Billie Eilish",
  artistSpotifyID: "6qqNVTkY8uBg9cP3Jd7DAH",
  releaseYear: 2021,
  imageURLs: [
    {
      url: "https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e",
      height: 640,
      width: 640,
    },
    {
      url: "https://i.scdn.co/image/ab67616d00001e022a038d3bf875d23e4aeaa84e",
      height: 300,
      width: 300,
    },
  ],
  finalScore: 85,
  affectsArtistScore: true,
  artistSpotifyIDs: ["6qqNVTkY8uBg9cP3Jd7DAH"],
  albumArtists: [
    {
      spotifyID: "6qqNVTkY8uBg9cP3Jd7DAH",
      name: "Billie Eilish",
      imageURLs: [
        {
          url: "https://i.scdn.co/image/ab6761610000e5eb",
          height: 226,
          width: 226,
        },
      ],
    },
  ],
};

export const mockUnreviewedAlbum: DisplayAlbum = {
  ...mockDisplayAlbum,
  finalScore: null,
};

export const mockDisplayArtist: DisplayArtist = {
  spotifyID: "6qqNVTkY8uBg9cP3Jd7DAH",
  name: "Billie Eilish",
  imageURLs: [
    {
      url: "https://i.scdn.co/image/ab6761610000e5eb",
      height: 226,
      width: 226,
    },
  ],
  totalScore: 80,
  peakScore: 90,
  latestScore: 75,
  leaderboardPosition: 5,
  peakLeaderboardPosition: 3,
  latestLeaderboardPosition: 8,
  unrated: false,
  albumCount: 3,
};

export const mockUnratedArtist: DisplayArtist = {
  ...mockDisplayArtist,
  unrated: true,
  totalScore: 0,
};
