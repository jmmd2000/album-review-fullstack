import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import ScoreBreakdown from "../ScoreBreakdown";
import { ReviewBonuses } from "@shared/types";

const zeroBonuses: ReviewBonuses = {
  perfectBonus: 0,
  qualityBonus: 0,
  consistencyBonus: 0,
  noWeakBonus: 0,
  terriblePenalty: 0,
  poorQualityPenalty: 0,
  noStrongPenalty: 0,
  totalBonus: 0,
};

describe("ScoreBreakdown", () => {
  it("renders nothing when closed", async () => {
    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={zeroBonuses} finalScore={70} isOpen={false} onClose={() => {}} />
    );

    expect(screen.queryByText("Score Breakdown")).not.toBeInTheDocument();
  });

  it("shows base score and final score when open", async () => {
    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={zeroBonuses} finalScore={72} isOpen onClose={() => {}} />
    );

    expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("shows bonus rows when bonuses are positive", async () => {
    const bonuses: ReviewBonuses = {
      ...zeroBonuses,
      qualityBonus: 1.5,
      perfectBonus: 1.0,
      totalBonus: 2.5,
    };

    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={bonuses} finalScore={73} isOpen onClose={() => {}} />
    );

    expect(screen.getByText("BONUSES")).toBeInTheDocument();
    expect(screen.getByText("Quality Tracks")).toBeInTheDocument();
    expect(screen.getByText("+1.5")).toBeInTheDocument();
    expect(screen.getByText("Perfect Tracks")).toBeInTheDocument();
    expect(screen.getByText("+1.0")).toBeInTheDocument();
  });

  it("shows penalty rows when penalties are negative", async () => {
    const bonuses: ReviewBonuses = {
      ...zeroBonuses,
      terriblePenalty: -2.5,
      poorQualityPenalty: -1.0,
      totalBonus: -3.5,
    };

    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={bonuses} finalScore={67} isOpen onClose={() => {}} />
    );

    expect(screen.getByText("PENALTIES")).toBeInTheDocument();
    expect(screen.getByText("Terrible Tracks")).toBeInTheDocument();
    expect(screen.getByText("-2.5")).toBeInTheDocument();
    expect(screen.getByText("Poor Quality")).toBeInTheDocument();
    expect(screen.getByText("-1.0")).toBeInTheDocument();
  });

  it("hides bonus/penalty headings when all values are zero", async () => {
    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={zeroBonuses} finalScore={70} isOpen onClose={() => {}} />
    );

    expect(screen.queryByText("BONUSES")).not.toBeInTheDocument();
    expect(screen.queryByText("PENALTIES")).not.toBeInTheDocument();
  });

  it("shows total adjustment", async () => {
    const bonuses: ReviewBonuses = {
      ...zeroBonuses,
      qualityBonus: 1.5,
      terriblePenalty: -0.5,
      totalBonus: 1.0,
    };

    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={bonuses} finalScore={71} isOpen onClose={() => {}} />
    );

    expect(screen.getByText("Total Adjustment:")).toBeInTheDocument();
    expect(screen.getByText("+1.0")).toBeInTheDocument();
  });

  it("handles null bonuses", async () => {
    await renderWithProviders(
      <ScoreBreakdown baseScore={70} bonuses={null} finalScore={70} isOpen onClose={() => {}} />
    );

    expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // total adjustment shows "0"
  });
});
