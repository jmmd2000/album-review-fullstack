import { afterEach, describe, expect, it, vi } from "vitest";
import { ignoreThisBrowser, trackEvent } from "@/lib/analytics";

afterEach(() => {
  delete window.umami;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("trackEvent", () => {
  it("sends the event name and its data to Umami", () => {
    const track = vi.fn();
    window.umami = { track };

    trackEvent("home-search", { query: "radiohead", result: "artist" });

    expect(track).toHaveBeenCalledWith("home-search", { query: "radiohead", result: "artist" });
  });

  it("does nothing when the Umami script is missing", () => {
    expect(() => trackEvent("tracks-show-all")).not.toThrow();
  });

  it("keeps an error from the Umami script away from the page", () => {
    window.umami = {
      track: () => {
        throw new Error("the script broke");
      },
    };

    expect(() => trackEvent("score-explainer-open")).not.toThrow();
  });
});

describe("ignoreThisBrowser", () => {
  it("sets the item the Umami script checks", () => {
    ignoreThisBrowser();

    expect(localStorage.getItem("umami.disabled")).toBe("1");
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });

    expect(() => ignoreThisBrowser()).not.toThrow();
  });
});
