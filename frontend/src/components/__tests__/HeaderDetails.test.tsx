import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import HeaderDetails from "../HeaderDetails";

describe("HeaderDetails", () => {
  it("renders the name as a heading", async () => {
    await renderWithProviders(<HeaderDetails name="Billie Eilish" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Billie Eilish");
  });

  it("renders the image when imageURL is provided", async () => {
    await renderWithProviders(
      <HeaderDetails
        name="Test"
        imageURL="https://i.scdn.co/image/ab676161000051744a21b4760d2ecb7b0dcdc8da"
      />
    );

    const img = screen.getByAltText("Test");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "https://i.scdn.co/image/ab676161000051744a21b4760d2ecb7b0dcdc8da"
    );
  });

  it("does not render an image when imageURL is not provided", async () => {
    await renderWithProviders(<HeaderDetails name="Test" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
