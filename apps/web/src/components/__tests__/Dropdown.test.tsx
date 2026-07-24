import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { Dropdown, type DropdownProps } from "../ui/Dropdown";

// The dropdown reads the current URL filters through the root route, replace
// that with a mutable stand-in.
const { searchState } = vi.hoisted(() => ({ searchState: { genres: undefined as string | undefined } }));

vi.mock("@/routes/__root", () => ({
  Route: { useSearch: () => searchState },
}));

const items = [
  { name: "Rock", value: "rock" },
  { name: "Pop", value: "pop" },
  { name: "Jazz", value: "jazz" },
];

const Harness = (props: Omit<DropdownProps, "dropdownRef">) => {
  const dropdownRef = useRef<HTMLUListElement>(null);
  return <Dropdown {...props} dropdownRef={dropdownRef} />;
};

beforeEach(() => {
  searchState.genres = undefined;
});

describe("Dropdown", () => {
  it("selecting in single mode reports the value and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const setIsOpen = vi.fn();
    render(<Harness items={items} isOpen={true} setIsOpen={setIsOpen} onSelect={onSelect} />);

    await user.click(screen.getByText("Pop"));

    expect(onSelect).toHaveBeenCalledWith(["pop"]);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it("selecting in multiple mode accumulates and can deselect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness items={items} isOpen={true} setIsOpen={vi.fn()} onSelect={onSelect} multiple />);

    await user.click(screen.getByText("Rock"));
    expect(onSelect).toHaveBeenLastCalledWith(["rock"]);

    await user.click(screen.getByText("Jazz"));
    expect(onSelect).toHaveBeenLastCalledWith(["rock", "jazz"]);

    await user.click(screen.getByText("Rock"));
    expect(onSelect).toHaveBeenLastCalledWith(["jazz"]);
  });

  it("the search box filters the list", async () => {
    const user = userEvent.setup();
    render(<Harness items={items} isOpen={true} setIsOpen={vi.fn()} onSelect={vi.fn()} multiple />);

    await user.type(screen.getByPlaceholderText("Search..."), "ja");

    expect(screen.getByText("Jazz")).toBeInTheDocument();
    expect(screen.queryByText("Rock")).not.toBeInTheDocument();
    expect(screen.queryByText("Pop")).not.toBeInTheDocument();
  });

  it("preselects from the genres in the URL on mount", () => {
    searchState.genres = "rock,pop";
    const onSelect = vi.fn();
    render(<Harness items={items} isOpen={false} setIsOpen={vi.fn()} onSelect={onSelect} multiple />);

    expect(onSelect).toHaveBeenCalledWith(["rock", "pop"]);
    expect(screen.getByText("Rock, Pop")).toBeInTheDocument();
  });

  it("falls back to the default selection on mount", () => {
    const onSelect = vi.fn();
    render(<Harness items={items} default={items[0]} isOpen={false} setIsOpen={vi.fn()} onSelect={onSelect} />);

    expect(onSelect).toHaveBeenCalledWith(["rock"]);
  });

  it("clicking outside the open list closes it", () => {
    const setIsOpen = vi.fn();
    render(<Harness items={items} isOpen={true} setIsOpen={setIsOpen} onSelect={vi.fn()} />);

    fireEvent.mouseDown(document.body);

    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
