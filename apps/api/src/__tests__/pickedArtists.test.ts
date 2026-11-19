import { describe, expect, test } from "vitest";
import { artistWeight, rankPickedArtists } from "@/helpers/pickedArtists";

describe("artistWeight", () => {
  test("scales an artist's lead over the overall average down when they have few albums", () => {
    expect(artistWeight({ spotifyID: "a", albumCount: 3, averageScore: 82 }, 70)).toBe(9);
    expect(artistWeight({ spotifyID: "b", albumCount: 1, averageScore: 90 }, 70)).toBe(10);
    expect(artistWeight({ spotifyID: "c", albumCount: 4, averageScore: 60 }, 70)).toBeLessThan(0);
  });
});

describe("rankPickedArtists", () => {
  const artists = [
    { spotifyID: "geese", albumCount: 1, averageScore: 90 },
    { spotifyID: "mountEerie", albumCount: 1, averageScore: 90 },
    { spotifyID: "belowAverage", albumCount: 3, averageScore: 50 },
  ];

  test("ranks an artist linked to two top artists above one linked to a single top artist", () => {
    const links = [
      { artistSpotifyID: "geese", linkedName: "Horsegirl", position: 1 },
      { artistSpotifyID: "geese", linkedName: "MJ Lenderman", position: 2 },
      { artistSpotifyID: "mountEerie", linkedName: "MJ Lenderman", position: 2 },
    ];

    const ranked = rankPickedArtists(artists, links, 70, []);

    expect(ranked.map(pick => pick.name)).toEqual(["MJ Lenderman", "Horsegirl"]);
  });

  test("a closer link counts for more than a distant one", () => {
    const links = [
      { artistSpotifyID: "geese", linkedName: "Distant", position: 80 },
      { artistSpotifyID: "mountEerie", linkedName: "Close", position: 1 },
    ];

    expect(rankPickedArtists(artists, links, 70, []).map(pick => pick.name)).toEqual(["Close", "Distant"]);
  });

  test("leaves out artists already reviewed and links from artists below the average", () => {
    const links = [
      { artistSpotifyID: "geese", linkedName: "wednesday", position: 1 },
      { artistSpotifyID: "belowAverage", linkedName: "From A Weak Artist", position: 1 },
      { artistSpotifyID: "geese", linkedName: "Horsegirl", position: 3 },
    ];

    expect(rankPickedArtists(artists, links, 70, ["Wednesday"]).map(pick => pick.name)).toEqual(["Horsegirl"]);
  });
});
