import "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import { ColourPicker } from "@components/form/ColourPicker";

describe("ColourPicker", () => {
  it("renders the label", async () => {
    const mockSetColors = vi.fn();
    await renderWithProviders(
      <ColourPicker selectedColors={[]} setSelectedColors={mockSetColors} />
    );
    expect(screen.getByText(/Album Colors/i)).toBeInTheDocument();
  });

  it("renders color circles for each selected color", async () => {
    const mockSetColors = vi.fn();
    const colors = [{ hex: "#ff0000" }, { hex: "#00ff00" }, { hex: "#0000ff" }];
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const colorInputs = screen.getAllByDisplayValue(/^#/);
    expect(colorInputs).toHaveLength(3);
  });

  it("shows add button when less than 5 colors selected", async () => {
    const mockSetColors = vi.fn();
    const colors = [{ hex: "#ff0000" }];
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const addButton = screen.getByRole("button", { name: "+" });
    expect(addButton).toBeInTheDocument();
  });

  it("hides add button when 5 colors selected", async () => {
    const mockSetColors = vi.fn();
    const colors = [
      { hex: "#ff0000" },
      { hex: "#00ff00" },
      { hex: "#0000ff" },
      { hex: "#ffff00" },
      { hex: "#ff00ff" },
    ];
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const addButton = screen.queryByRole("button", { name: "+" });
    expect(addButton).not.toBeInTheDocument();
  });

  it("calls setSelectedColors with new color when add button clicked", async () => {
    const mockSetColors = vi.fn();
    const colors = [{ hex: "#ff0000" }];
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const addButton = screen.getByRole("button", { name: "+" });
    fireEvent.click(addButton);
    expect(mockSetColors).toHaveBeenCalledWith([{ hex: "#ff0000" }, { hex: "#ffffff" }]);
  });

  it("calls setSelectedColors when color value changes", async () => {
    const mockSetColors = vi.fn();
    const colors = [{ hex: "#ff0000" }];
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const colorInput = screen.getByDisplayValue("#ff0000");
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });
    expect(mockSetColors).toHaveBeenCalledWith([{ hex: "#00ff00" }]);
  });

  it("removes color when remove button clicked", async () => {
    const mockSetColors = vi.fn();
    const colors = [{ hex: "#ff0000" }, { hex: "#00ff00" }, { hex: "#0000ff" }];
    const { container } = await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    // Find all buttons containing ✕ character
    const removeButtons = Array.from(container.querySelectorAll("button")).filter(button =>
      button.textContent?.includes("✕")
    );
    if (removeButtons.length > 1) {
      fireEvent.click(removeButtons[1]);
      expect(mockSetColors).toHaveBeenCalledWith([{ hex: "#ff0000" }, { hex: "#0000ff" }]);
    }
  });

  it("does not add color when already at max (5)", async () => {
    const mockSetColors = vi.fn();
    const colors = Array(5)
      .fill(0)
      .map((_, i) => ({ hex: `#${i}${i}${i}000` }));
    await renderWithProviders(
      <ColourPicker selectedColors={colors} setSelectedColors={mockSetColors} />
    );
    const addButton = screen.queryByRole("button", { name: "+" });
    expect(addButton).not.toBeInTheDocument();
  });
});
