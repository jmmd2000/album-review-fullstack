import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../useAuth";
import { client } from "@/lib/client";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        auth: {
          status: { $get: vi.fn() },
          login: { $post: vi.fn() },
          logout: { $post: vi.fn() },
        },
      },
    },
  };
});

const jsonResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Error",
  json: async () => data,
});

const statusGet = client.api.auth.status.$get as unknown as Mock;
const loginPost = client.api.auth.login.$post as unknown as Mock;
const logoutPost = client.api.auth.logout.$post as unknown as Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("reflects the admin status from the api", async () => {
    statusGet.mockResolvedValue(jsonResponse({ isAdmin: true }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAdmin).toBe(true);
  });

  it("defaults to not admin", async () => {
    statusGet.mockResolvedValue(jsonResponse({ isAdmin: false }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });

  it("login posts the password and refreshes the status", async () => {
    statusGet.mockResolvedValueOnce(jsonResponse({ isAdmin: false })).mockResolvedValue(jsonResponse({ isAdmin: true }));
    loginPost.mockResolvedValue(jsonResponse(null));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));

    await act(async () => {
      await result.current.login("secret");
    });

    expect(loginPost).toHaveBeenCalledWith({ json: { password: "secret" } });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
  });

  it("logout posts and drops the admin status", async () => {
    statusGet.mockResolvedValueOnce(jsonResponse({ isAdmin: true })).mockResolvedValue(jsonResponse({ isAdmin: false }));
    logoutPost.mockResolvedValue(jsonResponse(null));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutPost).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isAdmin).toBe(false));
  });

  it("a rejected login surfaces to the caller", async () => {
    statusGet.mockResolvedValue(jsonResponse({ isAdmin: false }));
    loginPost.mockResolvedValue(jsonResponse({ message: "Unauthorised" }, false, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));

    await expect(result.current.login("wrong")).rejects.toMatchObject({ status: 401 });
  });
});

describe("useAuth", () => {
  it("throws outside the provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be inside an AuthProvider");

    consoleSpy.mockRestore();
  });
});
