import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useAlbumStatus } from "../useAlbumStatus";
import { api } from "@/lib/api";
import { DisplayAlbum } from "@shared/types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockAlbums: DisplayAlbum[] = [
  {
    spotifyID: "album-1",
    name: "Album One",
    artistName: "Artist",
    artistSpotifyID: "artist-1",
    releaseYear: 2024,
    imageURLs: [],
    finalScore: null,
    affectsArtistScore: true,
    artistSpotifyIDs: ["artist-1"],
    albumArtists: [],
  },
  {
    spotifyID: "album-2",
    name: "Album Two",
    artistName: "Artist",
    artistSpotifyID: "artist-1",
    releaseYear: 2023,
    imageURLs: [],
    finalScore: 60,
    affectsArtistScore: true,
    artistSpotifyIDs: ["artist-1"],
    albumArtists: [],
  },
];

describe("useAlbumStatus", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("merges bookmark and score data into albums", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ "album-1": true, "album-2": false })
      .mockResolvedValueOnce([
        { spotifyID: "album-1", reviewScore: 85 },
        { spotifyID: "album-2", reviewScore: 72 },
      ]);

    const { result } = renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0].bookmarked).toBe(true);
    expect(result.current.data[0].finalScore).toBe(85);
    expect(result.current.data[1].bookmarked).toBe(false);
    expect(result.current.data[1].finalScore).toBe(72);
  });

  it("keeps the album's existing finalScore when API has no score for it", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({}).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // album-1 had null, stays null
    expect(result.current.data[0].finalScore).toBeNull();
    // album-2 had 60, stays 60
    expect(result.current.data[1].finalScore).toBe(60);
  });

  it("is loading while queries are in flight", () => {
    // Never resolve — stay pending
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
