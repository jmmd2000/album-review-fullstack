import { describe, expect, it } from "vitest";
import { timelinePoints } from "@/lib/scoreTimeline";

describe("timelinePoints", () => {
  it("spreads releases from 4% to 96% of the width", () => {
    const points = timelinePoints([
      { score: 60, year: 2016 },
      { score: 70, year: 2018 },
      { score: 80, year: 2020 },
      { score: 70, year: 2022 },
      { score: 60, year: 2024 },
    ]);
    expect(points.map(point => point.x)).toEqual([4, 27, 50, 73, 96]);
  });

  it("keeps a few releases 30% apart around the middle", () => {
    const two = timelinePoints([
      { score: 60, year: 2018 },
      { score: 70, year: 2020 },
    ]);
    const three = timelinePoints([
      { score: 60, year: 2018 },
      { score: 70, year: 2020 },
      { score: 80, year: 2022 },
    ]);
    expect(two.map(point => point.x)).toEqual([35, 65]);
    expect(three.map(point => point.x)).toEqual([20, 50, 80]);
  });

  it("puts a single release in the middle", () => {
    expect(timelinePoints([{ score: 70, year: 2020 }])[0].x).toBe(50);
  });

  it("puts the lowest score 6% up and a perfect score 86% up", () => {
    const points = timelinePoints([
      { score: 40, year: 2018 },
      { score: 100, year: 2020 },
    ]);
    expect(points[0].y).toBeCloseTo(6 + (12 / 72) * 80);
    expect(points[1].y).toBe(86);
  });

  it("starts the scale at 0 for very low scores", () => {
    const points = timelinePoints([
      { score: 5, year: 2018 },
      { score: 50, year: 2020 },
    ]);
    expect(points[0].y).toBe(10);
  });

  it("shows each year once", () => {
    const points = timelinePoints([
      { score: 60, year: 2020 },
      { score: 70, year: 2020 },
      { score: 80, year: 2021 },
    ]);
    expect(points.map(point => point.showYear)).toEqual([true, false, true]);
  });
});
