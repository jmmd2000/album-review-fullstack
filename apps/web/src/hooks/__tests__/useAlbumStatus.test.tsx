import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAlbumStatus } from "../useAlbumStatus";
import { client } from "@/lib/client";
import type { DisplayAlbum } from "@shared/types";

// Replace the RPC client's two status endpoints with mocks, but keep the real
// handle() so the response-unwrapping path is exercised for real.
vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        bookmarks: { status: { $get: vi.fn() } },
        albums: { scores: { $get: vi.fn() } },
      },
    },
  };
});

// Minimal stand-in for the hono ClientResponse that handle() reads.
const jsonResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Error",
  json: async () => data,
});

const bookmarksGet = client.api.bookmarks.status.$get as unknown as Mock;
const scoresGet = client.api.albums.scores.$get as unknown as Mock;

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

  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  it("merges bookmark and score data into albums", async () => {
    bookmarksGet.mockResolvedValue(jsonResponse({ "album-1": true, "album-2": false }));
    scoresGet.mockResolvedValue(
      jsonResponse([
        { spotifyID: "album-1", reviewScore: 85 },
        { spotifyID: "album-2", reviewScore: 72 },
      ])
    );

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
    bookmarksGet.mockResolvedValue(jsonResponse({}));
    scoresGet.mockResolvedValue(jsonResponse([]));

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
    bookmarksGet.mockReturnValue(new Promise(() => {}));
    scoresGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it("queries the correct endpoints with the right id formats", async () => {
    bookmarksGet.mockResolvedValue(jsonResponse({}));
    scoresGet.mockResolvedValue(jsonResponse([]));

    renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    await waitFor(() => {
      expect(scoresGet).toHaveBeenCalledWith({ query: { ids: "album-1,album-2" } });
    });
    expect(bookmarksGet).toHaveBeenCalledWith({ query: { ids: ["album-1", "album-2"] } });
  });

  it("surfaces isError when a query fails instead of hiding it", async () => {
    bookmarksGet.mockResolvedValue(jsonResponse({}));
    scoresGet.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAlbumStatus(mockAlbums), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
