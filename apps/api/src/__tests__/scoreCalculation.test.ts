import { describe, test, expect } from "vitest";
import { calculateLeaderboardPositions } from "../helpers/calculateLeaderboardPositions";

describe("calculateLeaderboardPositions", () => {
  test("should assign correct positions for unique scores", () => {
    const artists = [
      { id: 1, name: "Artist 1", score: 90 },
      { id: 2, name: "Artist 2", score: 80 },
      { id: 3, name: "Artist 3", score: 70 },
      { id: 4, name: "Artist 4", score: 60 },
    ];

    const positions = calculateLeaderboardPositions(artists);

    expect(positions).toHaveLength(4);
    expect(positions[0]).toEqual({
      id: 1,
      name: "Artist 1",
      score: 90,
      position: 1,
    });
    expect(positions[1]).toEqual({
      id: 2,
      name: "Artist 2",
      score: 80,
      position: 2,
    });
    expect(positions[2]).toEqual({
      id: 3,
      name: "Artist 3",
      score: 70,
      position: 3,
    });
    expect(positions[3]).toEqual({
      id: 4,
      name: "Artist 4",
      score: 60,
      position: 4,
    });
  });

  test("should handle tied scores correctly", () => {
    const artists = [
      { id: 1, name: "Artist 1", score: 90 },
      { id: 2, name: "Artist 2", score: 80 },
      { id: 3, name: "Artist 3", score: 80 }, // Tied with Artist 2
      { id: 4, name: "Artist 4", score: 70 },
    ];

    const positions = calculateLeaderboardPositions(artists);

    expect(positions).toHaveLength(4);
    expect(positions[0]).toEqual({
      id: 1,
      name: "Artist 1",
      score: 90,
      position: 1,
    });
    expect(positions[1]).toEqual({
      id: 2,
      name: "Artist 2",
      score: 80,
      position: 2,
    });
    expect(positions[2]).toEqual({
      id: 3,
      name: "Artist 3",
      score: 80,
      position: 2,
    }); // Same position
    expect(positions[3]).toEqual({
      id: 4,
      name: "Artist 4",
      score: 70,
      position: 4,
    });
  });

  test("should handle multiple ties", () => {
    const artists = [
      { id: 1, name: "Artist 1", score: 90 },
      { id: 2, name: "Artist 2", score: 80 },
      { id: 3, name: "Artist 3", score: 80 }, // Tied with Artist 2
      { id: 4, name: "Artist 4", score: 80 }, // Tied with Artist 2 and 3
      { id: 5, name: "Artist 5", score: 70 },
    ];

    const positions = calculateLeaderboardPositions(artists);

    expect(positions).toHaveLength(5);
    expect(positions[0]).toEqual({
      id: 1,
      name: "Artist 1",
      score: 90,
      position: 1,
    });
    expect(positions[1]).toEqual({
      id: 2,
      name: "Artist 2",
      score: 80,
      position: 2,
    });
    expect(positions[2]).toEqual({
      id: 3,
      name: "Artist 3",
      score: 80,
      position: 2,
    });
    expect(positions[3]).toEqual({
      id: 4,
      name: "Artist 4",
      score: 80,
      position: 2,
    });
    expect(positions[4]).toEqual({
      id: 5,
      name: "Artist 5",
      score: 70,
      position: 5,
    });
  });

  test("should handle empty array", () => {
    const positions = calculateLeaderboardPositions([]);
    expect(positions).toHaveLength(0);
  });

  test("should handle single artist", () => {
    const artists = [{ id: 1, name: "Artist 1", score: 90 }];
    const positions = calculateLeaderboardPositions(artists);

    expect(positions).toHaveLength(1);
    expect(positions[0]).toEqual({
      id: 1,
      name: "Artist 1",
      score: 90,
      position: 1,
    });
  });
});
