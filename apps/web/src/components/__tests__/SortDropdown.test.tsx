import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortDropdown from "../ui/SortDropdown";

const options = [
  { label: "Name", value: "name" },
  { label: "Year", value: "year" },
];

describe("SortDropdown", () => {
  it("shows the default option's label", () => {
    render(<SortDropdown options={options} onSortChange={vi.fn()} defaultValue="name" />);

    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows a placeholder when the default is not among the options", () => {
    render(<SortDropdown options={options} onSortChange={vi.fn()} />);

    expect(screen.getByText("Sort by...")).toBeInTheDocument();
  });

  it("selects an option and reports it with the current direction", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortDropdown options={options} onSortChange={onSortChange} defaultValue="name" defaultDirection="desc" />);

    await user.click(screen.getByText("Name"));
    await user.click(screen.getByText("Year"));

    expect(onSortChange).toHaveBeenCalledWith("year", "desc");
  });

  it("toggles the sort direction and reports the change", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortDropdown options={options} onSortChange={onSortChange} defaultValue="name" defaultDirection="desc" />);

    await user.click(screen.getByRole("button"));

    expect(onSortChange).toHaveBeenCalledWith("name", "asc");

    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith("name", "desc");
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(<SortDropdown options={options} onSortChange={vi.fn()} defaultValue="name" />);

    await user.click(screen.getByText("Name"));
    expect(screen.getByText("Year")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    // The exit animation removes the list shortly after the close
    await waitFor(() => expect(screen.queryByText("Year")).not.toBeInTheDocument());
  });
});
