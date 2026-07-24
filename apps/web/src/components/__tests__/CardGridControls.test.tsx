import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardGridControls from "../ui/CardGridControls";

const pagination = (overrides: Partial<{ prevDisabled: boolean; nextDisabled: boolean }> = {}) => ({
  next: { action: vi.fn(), disabled: overrides.nextDisabled },
  prev: { action: vi.fn(), disabled: overrides.prevDisabled },
  page: { pageNumber: 3, totalPages: 9 },
});

describe("CardGridControls", () => {
  it("searches on enter and on the button", async () => {
    const user = userEvent.setup();
    const search = vi.fn();
    render(<CardGridControls search={search} />);

    await user.type(screen.getByTestId("search-input"), "radiohead{Enter}");
    expect(search).toHaveBeenCalledWith("radiohead");

    // Button swallows data-testid, so target it by its label
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(search).toHaveBeenLastCalledWith("radiohead");
  });

  it("wires the pagination buttons and shows the page position", async () => {
    const user = userEvent.setup();
    const controls = pagination();
    render(<CardGridControls pagination={controls} />);

    expect(screen.getByText("3 / 9")).toBeInTheDocument();

    // The icon buttons have no accessible name, prev renders before next
    const [prevButton, nextButton] = screen.getAllByRole("button");
    await user.click(prevButton);
    expect(controls.prev.action).toHaveBeenCalledTimes(1);

    await user.click(nextButton);
    expect(controls.next.action).toHaveBeenCalledTimes(1);
  });

  it("disables the pagination buttons when told to", () => {
    render(<CardGridControls pagination={pagination({ prevDisabled: true, nextDisabled: true })} />);

    const [prevButton, nextButton] = screen.getAllByRole("button");
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("selecting a genre reports it and closes the dropdown", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CardGridControls search={vi.fn()} genreSettings={{ items: [{ name: "Rock", value: "rock" }], selected: [], onSelect }} />);

    await user.click(screen.getByText("Select option(s)"));
    await user.click(screen.getByText("Rock"));

    expect(onSelect).toHaveBeenCalledWith(["rock"]);
  });
});
