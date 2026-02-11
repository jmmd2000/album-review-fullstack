import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import ErrorComponent from "../ErrorComponent";

describe("ErrorComponent", () => {
  it("displays the error message", async () => {
    const error = new Error("Something went wrong");
    await renderWithProviders(<ErrorComponent error={error} reset={() => {}} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows the Error heading", async () => {
    const error = new Error("Oops");
    await renderWithProviders(<ErrorComponent error={error} reset={() => {}} />);

    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("shows only a Retry button for generic errors", async () => {
    const error = new Error("Network failure");
    await renderWithProviders(<ErrorComponent error={error} reset={() => {}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent("Retry");
  });

  it("shows both Edit and Retry buttons for 'album already exists' errors", async () => {
    const error = new Error("Album already exists in the database");
    await renderWithProviders(<ErrorComponent error={error} reset={() => {}} />);

    expect(screen.getByText("Edit the album instead")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("matches 'album already exists' case-insensitively", async () => {
    const error = new Error("ALBUM ALREADY EXISTS");
    await renderWithProviders(<ErrorComponent error={error} reset={() => {}} />);

    expect(screen.getByText("Edit the album instead")).toBeInTheDocument();
  });
});
