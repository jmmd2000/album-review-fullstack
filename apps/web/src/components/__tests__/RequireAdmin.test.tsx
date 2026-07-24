import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequireAdmin } from "../admin/RequireAdmin";

const { navigateMock, authState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  authState: { isAdmin: false, isPending: false },
}));

vi.mock("@/auth/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigateMock }));

beforeEach(() => {
  authState.isAdmin = false;
  authState.isPending = false;
  vi.clearAllMocks();
});

describe("RequireAdmin", () => {
  it("renders its children for an admin", () => {
    authState.isAdmin = true;

    render(
      <RequireAdmin>
        <div>admin only content</div>
      </RequireAdmin>
    );

    expect(screen.getByText("admin only content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("renders nothing and redirects home when not admin", () => {
    render(
      <RequireAdmin>
        <div>admin only content</div>
      </RequireAdmin>
    );

    expect(screen.queryByText("admin only content")).not.toBeInTheDocument();
    expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("holds without redirecting while the status is pending", () => {
    authState.isPending = true;

    render(
      <RequireAdmin>
        <div>admin only content</div>
      </RequireAdmin>
    );

    expect(screen.queryByText("admin only content")).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
