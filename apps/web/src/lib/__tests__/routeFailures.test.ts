import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/client";
import { routeFailuresToReport } from "@/lib/routeFailures";

describe("routeFailuresToReport", () => {
  it("keeps a route whose loader threw an unexpected error", () => {
    const error = new TypeError("fetch failed");
    expect(routeFailuresToReport([{ routeId: "/albums/", status: "error", error }])).toEqual([{ routeId: "/albums/", error }]);
  });

  it("leaves out an ApiError, because the API reports its own errors", () => {
    expect(routeFailuresToReport([{ routeId: "/albums/", status: "error", error: new ApiError("Server error", 500) }])).toEqual([]);
  });

  it("leaves out routes that did not fail", () => {
    const matches = [
      { routeId: "__root__", status: "success" },
      { routeId: "/albums/$albumID/", status: "notFound" },
      { routeId: "/stats/", status: "redirected" },
    ];
    expect(routeFailuresToReport(matches)).toEqual([]);
  });

  it("reports each failed route separately", () => {
    const first = new Error("first");
    const second = new Error("second");
    const matches = [
      { routeId: "/a/", status: "error", error: first },
      { routeId: "/b/", status: "success" },
      { routeId: "/c/", status: "error", error: second },
    ];
    expect(routeFailuresToReport(matches).map(failure => failure.error)).toEqual([first, second]);
  });
});
