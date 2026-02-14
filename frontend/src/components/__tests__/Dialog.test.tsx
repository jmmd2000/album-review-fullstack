import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import Dialog from "@components/ui/Dialog";

describe("Dialog", () => {
  it("renders children when open", async () => {
    await renderWithProviders(
      <Dialog isOpen onClose={() => {}}>
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("does not render children when closed", async () => {
    await renderWithProviders(
      <Dialog isOpen={false} onClose={() => {}}>
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
  });

  it("renders the title when provided", async () => {
    await renderWithProviders(
      <Dialog isOpen onClose={() => {}} title="My Dialog">
        <p>Content</p>
      </Dialog>
    );

    expect(screen.getByText("My Dialog")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const handleClose = vi.fn();
    const { user } = await renderWithProviders(
      <Dialog isOpen onClose={handleClose} title="Test">
        <p>Content</p>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: /close dialog/i });
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
