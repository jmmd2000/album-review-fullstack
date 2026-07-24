import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CardGrid from "../ui/CardGrid";

const cards = [<div key="1">Card One</div>, <div key="2">Card Two</div>, <div key="3">Card Three</div>];

describe("CardGrid", () => {
  it("renders every card", () => {
    render(<CardGrid cards={cards} />);

    expect(screen.getByText("Card One")).toBeInTheDocument();
    expect(screen.getByText("Card Two")).toBeInTheDocument();
    expect(screen.getByText("Card Three")).toBeInTheDocument();
  });

  it("shows the heading and results counter", () => {
    render(<CardGrid cards={cards} heading="Albums" counter={3} />);

    expect(screen.getByText("Albums")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 results")).toBeInTheDocument();
  });

  it("shows an empty state when there are no cards", () => {
    render(<CardGrid cards={[]} />);

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("inserts year dividers when sorted by year", () => {
    render(<CardGrid cards={cards} sortedByYear cardYears={[2024, 2024, 2023]} />);

    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders the controls when search or pagination is configured", () => {
    render(
      <CardGrid
        cards={cards}
        controls={{
          search: vi.fn(),
          pagination: {
            next: { action: vi.fn() },
            prev: { action: vi.fn() },
            page: { pageNumber: 2, totalPages: 7 },
          },
        }}
      />
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
  });
});
