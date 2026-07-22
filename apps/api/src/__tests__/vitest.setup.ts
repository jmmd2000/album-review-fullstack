import dotenv from "dotenv";
import { beforeAll, afterAll, vi } from "vitest";

dotenv.config();

vi.mock("@/helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: vi.fn(() => Promise.resolve(null)),
  fetchArtistHeadersFromSpotify: vi.fn(() => Promise.resolve({})),
}));

// Force the test environment regardless of what .env contains, so the database
// resolver and the resetTables guard both treat this unambiguously as a test run.
process.env.NODE_ENV = "test";

// Silence console for 4xx/5xx as the error handler logs each one
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
