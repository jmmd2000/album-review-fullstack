import { expect, test } from "vitest";
import { monthsBetween } from "@/api/services/ArtistListeningService";

test("fills every month from the first to the last, across a new year", () => {
  expect(monthsBetween("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
});

test("a single month gives just that month", () => {
  expect(monthsBetween("2026-03", "2026-03")).toEqual(["2026-03"]);
});
