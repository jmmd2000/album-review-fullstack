import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import AlbumCard from "@/components/album/AlbumCard";
import { mockDisplayAlbum, mockUnreviewedAlbum } from "@/__tests__/constants";
import { client } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        bookmarks: {
          ":albumID": {
            add: { $post: vi.fn() },
            remove: { $delete: vi.fn() },
          },
        },
      },
    },
  };
});

const jsonResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Error",
  json: async () => data,
});

const addPost = client.api.bookmarks[":albumID"].add.$post as unknown as Mock;
const removeDelete = client.api.bookmarks[":albumID"].remove.$delete as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AlbumCard", () => {
  it("renders album name and artist", async () => {
    await renderWithProviders(<AlbumCard album={mockDisplayAlbum} />);

    expect(screen.getByText("Happier Than Ever")).toBeInTheDocument();
    expect(screen.getByText("Billie Eilish")).toBeInTheDocument();
  });

  it("renders the album image with alt text", async () => {
    await renderWithProviders(<AlbumCard album={mockDisplayAlbum} />);

    const img = screen.getByAltText("Happier Than Ever");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", mockDisplayAlbum.imageURLs[1].url);
  });

  it("shows rating chip for reviewed albums", async () => {
    await renderWithProviders(<AlbumCard album={mockDisplayAlbum} />);

    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("shows bookmark button for unreviewed albums", async () => {
    await renderWithProviders(<AlbumCard album={mockUnreviewedAlbum} />);

    expect(screen.getByRole("button", { name: /add to bookmarks/i })).toBeInTheDocument();
  });

  it("does not show bookmark button for reviewed albums", async () => {
    await renderWithProviders(<AlbumCard album={mockDisplayAlbum} />);

    expect(screen.queryByRole("button", { name: /bookmark/i })).not.toBeInTheDocument();
  });

  it("links to the review page for reviewed albums", async () => {
    await renderWithProviders(<AlbumCard album={mockDisplayAlbum} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/albums/${mockDisplayAlbum.spotifyID}`);
  });

  it("links to the create page for unreviewed albums", async () => {
    await renderWithProviders(<AlbumCard album={mockUnreviewedAlbum} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/albums/${mockUnreviewedAlbum.spotifyID}/create`);
  });
});

describe("BookmarkButton toggle", () => {
  const albumID = mockUnreviewedAlbum.spotifyID;
  const statusKey = queryKeys.bookmarks.status([albumID]);

  it("optimistically flips the status caches and calls the add endpoint", async () => {
    addPost.mockResolvedValue(jsonResponse(null, true, 201));
    const { user, queryClient } = await renderWithProviders(<AlbumCard album={mockUnreviewedAlbum} bookmarked={false} />);
    queryClient.setQueryData(statusKey, { [albumID]: false });

    await user.click(screen.getByRole("button", { name: /add to bookmarks/i }));

    expect(queryClient.getQueryData(statusKey)).toEqual({ [albumID]: true });
    await waitFor(() => expect(addPost).toHaveBeenCalledTimes(1));
    expect(removeDelete).not.toHaveBeenCalled();
  });

  it("calls the remove endpoint when already bookmarked", async () => {
    removeDelete.mockResolvedValue(jsonResponse(null, true, 204));
    const { user, queryClient } = await renderWithProviders(<AlbumCard album={mockUnreviewedAlbum} bookmarked />);
    queryClient.setQueryData(statusKey, { [albumID]: true });

    await user.click(screen.getByRole("button", { name: /remove from bookmarks/i }));

    expect(queryClient.getQueryData(statusKey)).toEqual({ [albumID]: false });
    await waitFor(() => expect(removeDelete).toHaveBeenCalledTimes(1));
  });

  it("rolls the caches back and toasts when the request fails", async () => {
    addPost.mockResolvedValue(jsonResponse({ message: "nope" }, false, 400));
    const { user, queryClient } = await renderWithProviders(<AlbumCard album={mockUnreviewedAlbum} bookmarked={false} />);
    queryClient.setQueryData(statusKey, { [albumID]: false });

    await user.click(screen.getByRole("button", { name: /add to bookmarks/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(queryClient.getQueryData(statusKey)).toEqual({ [albumID]: false });
  });
});
