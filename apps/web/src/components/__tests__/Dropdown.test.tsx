import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { Dropdown, type DropdownProps } from "../ui/Dropdown";

const items = [
  { name: "Rock", value: "rock" },
  { name: "Pop", value: "pop" },
  { name: "Jazz", value: "jazz" },
];

const Harness = (props: Omit<DropdownProps, "dropdownRef">) => {
  const dropdownRef = useRef<HTMLUListElement>(null);
  return <Dropdown {...props} dropdownRef={dropdownRef} />;
};

describe("Dropdown", () => {
  it("shows the selected item's name on the trigger", () => {
    render(<Harness items={items} selected={["pop"]} isOpen={false} setIsOpen={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText("Pop")).toBeInTheDocument();
  });

  it("shows the placeholder when nothing is selected", () => {
    render(<Harness items={items} selected={[]} placeholder="Pick a genre" isOpen={false} setIsOpen={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText("Pick a genre")).toBeInTheDocument();
  });

  it("joins the selected names in multiple mode", () => {
    render(<Harness items={items} selected={["rock", "pop"]} isOpen={false} setIsOpen={vi.fn()} onSelect={vi.fn()} multiple />);

    expect(screen.getByText("Rock, Pop")).toBeInTheDocument();
  });

  it("selecting in single mode reports the value and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const setIsOpen = vi.fn();
    render(<Harness items={items} selected={[]} isOpen={true} setIsOpen={setIsOpen} onSelect={onSelect} />);

    await user.click(screen.getByText("Pop"));

    expect(onSelect).toHaveBeenCalledWith(["pop"]);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it("multiple mode reports additions and removals against the controlled selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness items={items} selected={["rock"]} isOpen={true} setIsOpen={vi.fn()} onSelect={onSelect} multiple />);

    await user.click(screen.getByText("Jazz"));
    expect(onSelect).toHaveBeenLastCalledWith(["rock", "jazz"]);

    await user.click(screen.getAllByText("Rock")[1]);
    expect(onSelect).toHaveBeenLastCalledWith([]);
  });

  it("the search box filters the list", async () => {
    const user = userEvent.setup();
    render(<Harness items={items} selected={[]} isOpen={true} setIsOpen={vi.fn()} onSelect={vi.fn()} multiple />);

    await user.type(screen.getByPlaceholderText("Search..."), "ja");

    expect(screen.getByText("Jazz")).toBeInTheDocument();
    expect(screen.queryByText("Rock")).not.toBeInTheDocument();
    expect(screen.queryByText("Pop")).not.toBeInTheDocument();
  });

  it("clicking outside the open list closes it", () => {
    const setIsOpen = vi.fn();
    render(<Harness items={items} selected={[]} isOpen={true} setIsOpen={setIsOpen} onSelect={vi.fn()} />);

    fireEvent.mouseDown(document.body);

    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
