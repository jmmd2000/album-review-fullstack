import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "../ui/Skeleton";

describe("Skeleton", () => {
  it("renders the grid variant", () => {
    render(<Skeleton variant="grid" />);

    expect(screen.getByTestId("skeleton-grid")).toBeInTheDocument();
  });

  it("renders the detail variant", () => {
    render(<Skeleton variant="detail" />);

    expect(screen.getByTestId("skeleton-detail")).toBeInTheDocument();
  });
});
