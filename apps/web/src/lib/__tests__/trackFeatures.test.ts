import { describe, expect, it } from "vitest";
import { extraFeatures } from "@/lib/trackFeatures";

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
