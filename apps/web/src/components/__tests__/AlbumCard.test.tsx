import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import AlbumCard from "@components/album/AlbumCard";
import { mockDisplayAlbum, mockUnreviewedAlbum } from "@/__tests__/constants";

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
