import { describe, expect, it } from "vitest";
import { usableCoverColours } from "@/lib/coverColours";

describe("usableCoverColours", () => {
  it("keeps vivid colours, most vivid first", () => {
    expect(usableCoverColours([{ hex: "#8c6d4f" }, { hex: "#e03030" }, { hex: "#2f6fd6" }])).toEqual(["#e03030", "#2f6fd6", "#8c6d4f"]);
  });

  it("drops greys", () => {
    expect(usableCoverColours([{ hex: "#808080" }, { hex: "#e03030" }])).toEqual(["#e03030"]);
  });

  it("drops colours that would vanish into the dark page", () => {
    expect(usableCoverColours([{ hex: "#3a2010" }, { hex: "#2f6fd6" }])).toEqual(["#2f6fd6"]);
  });

  it("drops colours that would vanish into the light page", () => {
    expect(usableCoverColours([{ hex: "#fbe9d0" }, { hex: "#2f6fd6" }])).toEqual(["#2f6fd6"]);
  });

  it("skips anything that isn't a six digit hex colour", () => {
    expect(usableCoverColours([{ hex: "red" }, { hex: "#e03" }, { hex: "#e03030" }])).toEqual(["#e03030"]);
  });

  it("returns nothing for a black and white cover", () => {
    expect(usableCoverColours([{ hex: "#111111" }, { hex: "#f5f5f5" }])).toEqual([]);
  });
});
