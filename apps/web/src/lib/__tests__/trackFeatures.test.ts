import { describe, expect, it } from "vitest";
import { extraFeatures, splitFeatures } from "@/lib/trackFeatures";

describe("extraFeatures", () => {
  it("leaves out artists the title already names, whatever the case", () => {
    expect(extraFeatures("Lace It (with Eminem & benny blanco)", [{ name: "Eminem" }, { name: "Benny Blanco" }])).toEqual([]);
  });

  it("keeps artists the title doesn't mention", () => {
    expect(extraFeatures("Goodbye", [{ name: "The Kid LAROI" }])).toEqual([{ name: "The Kid LAROI" }]);
  });

  it("keeps only the ones missing when the title names some", () => {
    expect(extraFeatures("Song (with A)", [{ name: "A" }, { name: "B" }])).toEqual([{ name: "B" }]);
  });
});

describe("splitFeatures", () => {
  it("takes a bracketed credit off the end of the name", () => {
    expect(splitFeatures("2099 (feat. Troye Sivan)", [{ name: "Troye Sivan" }])).toEqual({ title: "2099", featuring: ["Troye Sivan"] });
    expect(splitFeatures("3AM (Pull Up) [feat. MØ]", [{ name: "MØ" }])).toEqual({ title: "3AM (Pull Up)", featuring: ["MØ"] });
    expect(splitFeatures("Lace It (with Eminem & benny blanco)", [{ name: "Eminem" }, { name: "Benny Blanco" }])).toEqual({ title: "Lace It", featuring: ["Eminem", "Benny Blanco"] });
  });

  it("takes a trailing credit off the end of the name", () => {
    expect(splitFeatures("Song - feat. A", [{ name: "A" }])).toEqual({ title: "Song", featuring: ["A"] });
    expect(splitFeatures("Song ft. A", [{ name: "A" }])).toEqual({ title: "Song", featuring: ["A"] });
  });

  it("leaves names without a credit alone", () => {
    expect(splitFeatures("Roll with Me", [])).toEqual({ title: "Roll with Me", featuring: [] });
    expect(splitFeatures("Dreamer - Compound Version", [{ name: "RAYE" }])).toEqual({ title: "Dreamer - Compound Version", featuring: ["RAYE"] });
  });

  it("keeps a credit in the middle of the name, and lists only the features it doesn't name", () => {
    expect(splitFeatures("Song (feat. A) - Remix", [{ name: "A" }, { name: "B" }])).toEqual({ title: "Song (feat. A) - Remix", featuring: ["B"] });
  });

  it("uses the credit text when the track has no feature list", () => {
    expect(splitFeatures("Song (feat. A and B)", [])).toEqual({ title: "Song", featuring: ["A and B"] });
  });

  it("leaves out the given artist", () => {
    expect(splitFeatures("Messy Hair", [{ name: "Magdalena Bay" }], "Magdalena Bay")).toEqual({ title: "Messy Hair", featuring: [] });
  });
});
