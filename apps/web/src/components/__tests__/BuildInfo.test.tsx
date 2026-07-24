import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuildInfo } from "@/components/settings/BuildInfo";
import { client } from "@/lib/client";

vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        settings: {
          "build-info": { $get: vi.fn() },
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

const buildInfoGet = client.api.settings["build-info"].$get as unknown as Mock;

const payload = (sha: string) => ({
  api: { sha, message: "feat: something good", builtAt: "2026-07-24T10:00:00Z" },
  versions: {
    node: "v22.22.0",
    postgres: "15.18",
    packages: { hono: "4.12.31", "drizzle-orm": "0.45.2", pg: "8.22.0", zod: "4.4.3" },
  },
});

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.clearAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

describe("BuildInfo", () => {
  it("shows both commits, the message and the versions", async () => {
    // The web sha in tests is "test-web-sha" from the vitest define
    buildInfoGet.mockResolvedValue(jsonResponse(payload("test-web-sha")));

    render(<BuildInfo />, { wrapper });

    // The sha shows twice, once for the api row and once for the web row
    expect(await screen.findAllByText("test-web-sha")).toHaveLength(2);
    expect(screen.getByText('"feat: something good"')).toBeInTheDocument();
    expect(screen.getByText("v22.22.0")).toBeInTheDocument();
    expect(screen.getByText("15.18")).toBeInTheDocument();
    expect(screen.getByText("4.12.31")).toBeInTheDocument();
  });

  it("stays quiet when api and web match", async () => {
    buildInfoGet.mockResolvedValue(jsonResponse(payload("test-web-sha")));

    render(<BuildInfo />, { wrapper });

    await screen.findAllByText("test-web-sha");
    expect(screen.queryByTestId("build-info-mismatch")).not.toBeInTheDocument();
  });

  it("warns when api and web are on different commits", async () => {
    buildInfoGet.mockResolvedValue(jsonResponse(payload("abc1234")));

    render(<BuildInfo />, { wrapper });

    expect(await screen.findByTestId("build-info-mismatch")).toBeInTheDocument();
  });

  it("does not warn for dev builds", async () => {
    buildInfoGet.mockResolvedValue(jsonResponse(payload("dev")));

    render(<BuildInfo />, { wrapper });

    await screen.findByText("dev");
    expect(screen.queryByTestId("build-info-mismatch")).not.toBeInTheDocument();
  });

  it("shows a failure message when the request errors", async () => {
    buildInfoGet.mockResolvedValue(jsonResponse({ message: "Unauthorised" }, false, 401));

    render(<BuildInfo />, { wrapper });

    expect(await screen.findByText("Couldn't load build info.")).toBeInTheDocument();
  });
});
