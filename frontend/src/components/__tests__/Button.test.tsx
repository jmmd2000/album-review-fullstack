import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import Button from "../Button";

describe("Button", () => {
  it("renders the label text", async () => {
    await renderWithProviders(<Button label="Click me" />);

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const { user } = await renderWithProviders(<Button label="Click me" onClick={handleClick} />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", async () => {
    await renderWithProviders(<Button label="Nope" disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const { user } = await renderWithProviders(
      <Button label="Nope" onClick={handleClick} disabled />
    );

    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("is disabled when loading", async () => {
    await renderWithProviders(<Button label="Save" states={{ loading: true }} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("sets the button type attribute", async () => {
    await renderWithProviders(<Button label="Submit" type="submit" />);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
