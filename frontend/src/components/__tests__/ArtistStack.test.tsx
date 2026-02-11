import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import ArtistStack from "../ArtistStack";

const mockArtists = [
  {
    spotifyID: "a1",
    name: "Alice",
    imageURLs: [{ url: "https://i.scdn.co/image/ab6761610000f178cbf22720296d758d8b373a85" }],
  },
  {
    spotifyID: "a2",
    name: "Bob",
    imageURLs: [{ url: "https://i.scdn.co/image/ab6761610000f178f8b90fcffca3c4e28564f0e3" }],
  },
  {
    spotifyID: "a3",
    name: "Charlie",
    imageURLs: [{ url: "https://i.scdn.co/image/ab6761610000f1784804c4a44c85afea1a72d1bdg" }],
  },
];

describe("ArtistStack", () => {
  it("renders artist images", async () => {
    await renderWithProviders(<ArtistStack artists={mockArtists} />);

    expect(screen.getByAltText("Alice")).toBeInTheDocument();
    expect(screen.getByAltText("Bob")).toBeInTheDocument();
    expect(screen.getByAltText("Charlie")).toBeInTheDocument();
  });

  it("renders all artist names as text", async () => {
    await renderWithProviders(<ArtistStack artists={mockArtists} />);

    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it("shows overflow counter when artists exceed maxVisible", async () => {
    const fiveArtists = [
      ...mockArtists,
      {
        spotifyID: "a4",
        name: "Diana",
        imageURLs: [
          { url: "https://i.scdn.co/image/ab6761610000f178d80695211689a9c8c3fee3b0" },
        ],
      },
      {
        spotifyID: "a5",
        name: "Eve",
        imageURLs: [
          { url: "https://i.scdn.co/image/ab6761610000f178bc9546a945c7563a9eb21f3d" },
        ],
      },
    ];

    await renderWithProviders(<ArtistStack artists={fiveArtists} maxVisible={3} />);

    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not show overflow counter when artists fit within maxVisible", async () => {
    await renderWithProviders(<ArtistStack artists={mockArtists} maxVisible={4} />);

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("shows initial letter when artist has no image", async () => {
    const noImage = [{ spotifyID: "a1", name: "Alice", imageURLs: [] }];
    await renderWithProviders(<ArtistStack artists={noImage} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders links when linkable is true", async () => {
    await renderWithProviders(<ArtistStack artists={mockArtists} linkable />);

    const links = screen.getAllByRole("link");
    // 3 image links + 3 name links
    expect(links).toHaveLength(6);
  });

  it("renders no links when linkable is false", async () => {
    await renderWithProviders(<ArtistStack artists={mockArtists} linkable={false} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
