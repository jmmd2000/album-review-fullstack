import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortDropdown from "@/components/ui/SortDropdown";

const options = [
  { label: "Name", value: "name" },
  { label: "Year", value: "year" },
];

describe("SortDropdown", () => {
  it("shows the label for the controlled value", () => {
    render(<SortDropdown options={options} onSortChange={vi.fn()} value="name" />);

    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows a placeholder without a value", () => {
    render(<SortDropdown options={options} onSortChange={vi.fn()} />);

    expect(screen.getByText("Sort by...")).toBeInTheDocument();
  });

  it("reports a selection with the current direction and leaves state to the parent", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const { rerender } = render(<SortDropdown options={options} onSortChange={onSortChange} value="name" direction="desc" />);

    await user.click(screen.getByText("Name"));
    await user.click(screen.getByText("Year"));

    expect(onSortChange).toHaveBeenCalledWith("year", "desc");

    // Wait out the list's exit animation, then only the trigger text remains
    await waitFor(() => expect(screen.queryByText("Year")).not.toBeInTheDocument());
    // Still controlled by the old value until the parent passes the new one
    expect(screen.getByText("Name")).toBeInTheDocument();

    rerender(<SortDropdown options={options} onSortChange={onSortChange} value="year" direction="desc" />);
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("reports a direction toggle from the controlled direction", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const { rerender } = render(<SortDropdown options={options} onSortChange={onSortChange} value="name" direction="desc" />);

    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith("name", "asc");

    rerender(<SortDropdown options={options} onSortChange={onSortChange} value="name" direction="asc" />);
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith("name", "desc");
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(<SortDropdown options={options} onSortChange={vi.fn()} value="name" />);

    await user.click(screen.getByText("Name"));
    expect(screen.getByText("Year")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    // The exit animation removes the list shortly after the close
    await waitFor(() => expect(screen.queryByText("Year")).not.toBeInTheDocument());
  });
});
