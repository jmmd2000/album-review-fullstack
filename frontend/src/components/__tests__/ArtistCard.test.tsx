import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import ArtistCard from "../ArtistCard";
import { mockDisplayArtist, mockUnratedArtist } from "@/__tests__/constants";

describe("ArtistCard", () => {
  it("renders artist name", async () => {
    await renderWithProviders(<ArtistCard artist={mockDisplayArtist} />);

    expect(screen.getByText("Billie Eilish")).toBeInTheDocument();
  });

  it("renders artist image with alt text", async () => {
    await renderWithProviders(<ArtistCard artist={mockDisplayArtist} />);

    const img = screen.getByAltText("Billie Eilish");
    expect(img).toBeInTheDocument();
  });

  it("shows placeholder when image is missing", async () => {
    const noImage = { ...mockDisplayArtist, imageURLs: [] };
    await renderWithProviders(<ArtistCard artist={noImage} />);

    expect(screen.getByLabelText("Billie Eilish image unavailable")).toBeInTheDocument();
  });

  it("shows leaderboard position and album count for rated artists", async () => {
    await renderWithProviders(<ArtistCard artist={mockDisplayArtist} />);

    expect(screen.getByText(/^#5/)).toBeInTheDocument();
    expect(screen.getByText(/3 albums/)).toBeInTheDocument();
  });

  it("does not show leaderboard position for unrated artists", async () => {
    await renderWithProviders(<ArtistCard artist={mockUnratedArtist} />);

    expect(screen.getByText("3 albums")).toBeInTheDocument();
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });

  it("shows singular album for artists with one album", async () => {
    const singleAlbum = { ...mockDisplayArtist, albumCount: 1, unrated: true };
    await renderWithProviders(<ArtistCard artist={singleAlbum} />);

    expect(screen.getByText("1 album")).toBeInTheDocument();
  });

  it("links to the artist page", async () => {
    await renderWithProviders(<ArtistCard artist={mockDisplayArtist} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/artists/${mockDisplayArtist.spotifyID}`);
  });

  it("displays the rating chip", async () => {
    await renderWithProviders(<ArtistCard artist={mockDisplayArtist} />);

    expect(screen.getByText("80")).toBeInTheDocument();
  });
});
