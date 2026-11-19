import "@/config/loadEnvironment";
import { beforeEach, afterAll, vi } from "vitest";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";

vi.mock("@/helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: vi.fn(() => Promise.resolve(null)),
  fetchArtistHeadersFromSpotify: vi.fn(() => Promise.resolve({})),
}));

// Force the test environment regardless of what .env contains, so the database
// resolver and the resetTables guard both treat this unambiguously as a test run.
process.env.NODE_ENV = "test";

// Silence console for 4xx/5xx as the error handler logs each one.
// Before each test, because a test's own vi.restoreAllMocks() also undoes these.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // Saving a review starts this in the background, and it calls Deezer. A test that needs it restores the real one.
  vi.spyOn(ListenerLinkService, "linkUnmatchedArtists").mockResolvedValue();
});

afterAll(() => {
  vi.restoreAllMocks();
});
