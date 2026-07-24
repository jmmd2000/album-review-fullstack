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

const bonuses = {
  qualityBonus: 1.5,
  perfectBonus: 1,
  consistencyBonus: 0,
  noWeakBonus: 1,
  terriblePenalty: 0,
  poorQualityPenalty: 0,
  noStrongPenalty: 0,
  totalBonus: 3.5,
};

describe("RatingChip interactions", () => {
  it("opens the unrated explanation dialog from the info button", async () => {
    const { user } = await renderWithProviders(<RatingChip rating={0} />);

    await user.click(screen.getByRole("button", { name: "Why is this artist unrated?" }));

    expect(screen.getByText("Unrated artists")).toBeInTheDocument();
  });

  it("hides the unrated info button when asked to", async () => {
    await renderWithProviders(<RatingChip rating={0} options={{ hideUnratedDialog: true }} />);

    expect(screen.queryByRole("button", { name: "Why is this artist unrated?" })).not.toBeInTheDocument();
  });

  it("opens the score breakdown from the info button", async () => {
    const { user } = await renderWithProviders(<RatingChip rating={85} options={{ textBelow: true }} scoreBreakdown={{ baseScore: 82, bonuses, affectsArtistScore: true }} />);

    await user.click(screen.getByRole("button", { name: "View score breakdown" }));

    expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("opens the custom tooltip dialog for artist scores", async () => {
    const { user } = await renderWithProviders(<RatingChip rating={85} options={{ textBelow: true }} tooltipContent={{ title: "Artist score", description: "An average of their albums." }} />);

    await user.click(screen.getByRole("button", { name: "View score info" }));

    expect(screen.getByText("Artist score")).toBeInTheDocument();
    expect(screen.getByText("An average of their albums.")).toBeInTheDocument();
  });

  it("flags reviews that do not affect the artist score", async () => {
    await renderWithProviders(<RatingChip rating={85} scoreBreakdown={{ baseScore: 82, bonuses, affectsArtistScore: false }} />);

    expect(screen.getByLabelText("Does not affect artist score")).toBeInTheDocument();
  });
});
