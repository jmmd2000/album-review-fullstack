import { describe, expect, it } from "vitest";
import { Route } from "@/routes/__root";

describe("root route", () => {
  // The router runs the scripts of a route's head again on every page change, and each run starts another copy of the script
  it("adds no scripts to the page head", async () => {
    // The head reads nothing from its argument
    const head = await Route.options.head?.({} as never);

    expect(head?.scripts).toBeUndefined();
  });
});
