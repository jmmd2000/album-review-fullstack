import { expect, test } from "vitest";
import { normaliseISRC } from "@/helpers/normaliseISRC";

test("an ISRC written with dashes matches the same ISRC written without them", () => {
  expect(normaliseISRC("DE-Z20-06-00039")).toBe(normaliseISRC("DEZ200600039"));
});

test("anything that isn't 12 letters and digits is no ISRC", () => {
  expect(normaliseISRC("not an isrc at all")).toBeNull();
  expect(normaliseISRC(undefined)).toBeNull();
});
