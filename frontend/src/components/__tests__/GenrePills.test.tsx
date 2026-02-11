import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import GenrePills from "../GenrePills";
import { Genre } from "@shared/types";

const now = new Date();
const mockGenres: Genre[] = [
  { id: 1, name: "Hip Hop", slug: "hip-hop", createdAt: now, updatedAt: now },
  { id: 2, name: "R&B", slug: "r-and-b", createdAt: now, updatedAt: now },
  { id: 3, name: "Pop", slug: "pop", createdAt: now, updatedAt: now },
];

describe("GenrePills", () => {
  it("renders all genre names", async () => {
    await renderWithProviders(<GenrePills genres={mockGenres} />);

    expect(screen.getByText("Hip Hop")).toBeInTheDocument();
    expect(screen.getByText("R&B")).toBeInTheDocument();
    expect(screen.getByText("Pop")).toBeInTheDocument();
  });

  it("renders each genre as a link", async () => {
    await renderWithProviders(<GenrePills genres={mockGenres} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("renders nothing when genres array is empty", async () => {
    await renderWithProviders(<GenrePills genres={[]} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
