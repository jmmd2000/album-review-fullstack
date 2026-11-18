import { describe, test, expect } from "vitest";
import { matchGenres } from "@/helpers/matchGenres";

const genreList = ["hip-hop", "pop rap", "alt-rock", "r&b", "post-rock", "synth-pop", "dream pop"];

describe("matchGenres", () => {
  test("matches whatever the case", () => {
    expect(matchGenres(["Hip-Hop"], genreList)).toEqual([{ name: "hip-hop", isNew: false }]);
  });

  test("treats hyphens and spaces as the same", () => {
    expect(matchGenres(["hip hop", "pop-rap", "dream-pop"], genreList)).toEqual([
      { name: "hip-hop", isNew: false },
      { name: "pop rap", isNew: false },
      { name: "dream pop", isNew: false },
    ]);
  });

  test('treats "&" and "and" as the same', () => {
    expect(matchGenres(["r and b"], genreList)).toEqual([{ name: "r&b", isNew: false }]);
  });

  test("matches through the alias list", () => {
    expect(matchGenres(["alternative rock", "synthpop", "rhythm and blues"], genreList)).toEqual([
      { name: "alt-rock", isNew: false },
      { name: "synth-pop", isNew: false },
      { name: "r&b", isNew: false },
    ]);
  });

  test("doesn't match a near name", () => {
    expect(matchGenres(["post-punk"], genreList)).toEqual([{ name: "post-punk", isNew: true }]);
  });

  test("keeps MusicBrainz's order and leaves out repeats", () => {
    expect(matchGenres(["shoegaze", "hip hop", "Hip-Hop", "Shoegaze"], genreList)).toEqual([
      { name: "shoegaze", isNew: true },
      { name: "hip-hop", isNew: false },
    ]);
  });
});
