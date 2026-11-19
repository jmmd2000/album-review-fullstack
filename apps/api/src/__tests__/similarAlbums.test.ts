import { describe, expect, test } from "vitest";
import { genreWeight, orderSimilarAlbums } from "@/helpers/similarAlbums";

const RARE_GENRE = 1;
const COMMON_GENRE = 2;
const genreAlbumCounts = new Map([
  [RARE_GENRE, 3],
  [COMMON_GENRE, 150],
]);

describe("genreWeight", () => {
  test("a rare genre counts for more than a common one, and a genre on every album counts for nothing", () => {
    expect(genreWeight(300, 3)).toBeGreaterThan(genreWeight(300, 150));
    expect(genreWeight(300, 300)).toBe(0);
  });
});

describe("orderSimilarAlbums", () => {
  test("puts albums by linked artists first, closest link first, then fills with shared genres", () => {
    const order = orderSimilarAlbums({
      linked: [
        { albumSpotifyID: "linked-far", artistSpotifyID: "linked-far-artist", position: 9, finalScore: 90 },
        { albumSpotifyID: "linked-close", artistSpotifyID: "linked-close-artist", position: 1, finalScore: 60 },
      ],
      byGenre: [{ albumSpotifyID: "genre-only", artistSpotifyID: "genre-only-artist", sharedGenreIDs: [RARE_GENRE, COMMON_GENRE], finalScore: 99 }],
      genreAlbumCounts,
      totalAlbums: 300,
      limit: 6,
    });

    expect(order).toEqual(["linked-close", "linked-far", "genre-only"]);
  });

  test("ranks a rare shared genre above a common one, whatever the scores", () => {
    const order = orderSimilarAlbums({
      linked: [],
      byGenre: [
        { albumSpotifyID: "common", artistSpotifyID: "common-artist", sharedGenreIDs: [COMMON_GENRE], finalScore: 95 },
        { albumSpotifyID: "rare", artistSpotifyID: "rare-artist", sharedGenreIDs: [RARE_GENRE], finalScore: 40 },
      ],
      genreAlbumCounts,
      totalAlbums: 300,
      limit: 6,
    });

    expect(order).toEqual(["rare", "common"]);
  });

  test("breaks a tie on link place with the better score, and doesn't list a linked album twice", () => {
    const order = orderSimilarAlbums({
      linked: [
        { albumSpotifyID: "worse", artistSpotifyID: "worse-artist", position: 2, finalScore: 50 },
        { albumSpotifyID: "better", artistSpotifyID: "better-artist", position: 2, finalScore: 80 },
      ],
      byGenre: [{ albumSpotifyID: "better", artistSpotifyID: "better-artist", sharedGenreIDs: [RARE_GENRE], finalScore: 80 }],
      genreAlbumCounts,
      totalAlbums: 300,
      limit: 6,
    });

    expect(order).toEqual(["better", "worse"]);
  });

  test("takes at most one album by each artist, its best scored, from the links and the genres alike", () => {
    const order = orderSimilarAlbums({
      linked: [
        { albumSpotifyID: "bcnr-older", artistSpotifyID: "bcnr", position: 1, finalScore: 60 },
        { albumSpotifyID: "bcnr-best", artistSpotifyID: "bcnr", position: 1, finalScore: 72 },
        { albumSpotifyID: "wednesday", artistSpotifyID: "wednesday", position: 2, finalScore: 76 },
      ],
      byGenre: [
        { albumSpotifyID: "bcnr-genre", artistSpotifyID: "bcnr", sharedGenreIDs: [RARE_GENRE], finalScore: 90 },
        { albumSpotifyID: "strokes", artistSpotifyID: "strokes", sharedGenreIDs: [COMMON_GENRE], finalScore: 50 },
      ],
      genreAlbumCounts,
      totalAlbums: 300,
      limit: 6,
    });

    expect(order).toEqual(["bcnr-best", "wednesday", "strokes"]);
  });

  test("stops at the limit", () => {
    const linked = ["a", "b", "c"].map((albumSpotifyID, index) => ({ albumSpotifyID, artistSpotifyID: `${albumSpotifyID}-artist`, position: index + 1, finalScore: 50 }));
    expect(orderSimilarAlbums({ linked, byGenre: [], genreAlbumCounts, totalAlbums: 300, limit: 2 })).toEqual(["a", "b"]);
  });
});
