import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import RatingChip from "@components/ui/RatingChip";

describe("RatingChip", () => {
  it("displays the numeric rating", async () => {
    await renderWithProviders(<RatingChip rating={75} />);

    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("displays 'UNRATED' when rating is 0", async () => {
    await renderWithProviders(<RatingChip rating={0} />);

    expect(screen.getByText("UNRATED")).toBeInTheDocument();
  });

  it("displays the rating label when ratingString option is set", async () => {
    await renderWithProviders(<RatingChip rating={85} options={{ ratingString: true }} />);

    expect(screen.getByText("Amazing")).toBeInTheDocument();
  });

  it("shows the text label below when textBelow is set", async () => {
    await renderWithProviders(<RatingChip rating={85} options={{ textBelow: true }} />);

    // Both the number and the label should be visible
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Amazing")).toBeInTheDocument();
  });

  it("does not show the text label below by default", async () => {
    await renderWithProviders(<RatingChip rating={85} />);

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.queryByText("Amazing")).not.toBeInTheDocument();
  });

  it("does not show text label below for unrated", async () => {
    await renderWithProviders(<RatingChip rating={0} options={{ textBelow: true }} />);

    expect(screen.getByText("UNRATED")).toBeInTheDocument();
    // The label paragraph is conditional on rating > 0
    expect(screen.queryByText("Unrated")).not.toBeInTheDocument();
  });
});
