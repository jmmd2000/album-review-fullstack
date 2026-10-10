import { describe, expect, it } from "vitest";
import { canScoreArrive, markScoreArrived } from "@/lib/scoreArrival";

describe("scoreArrival", () => {
  it("counts up the first time an album opens, and shows it in place after that", () => {
    expect(canScoreArrive("album-1")).toBe(true);
    markScoreArrived("album-1");
    expect(canScoreArrive("album-1")).toBe(false);
  });

  it("keeps track of each album on its own", () => {
    markScoreArrived("album-2");
    expect(canScoreArrive("album-3")).toBe(true);
  });
});
