import { describe, it, expect, vi } from "vitest";
import { useListControls } from "@/hooks/useListControls";

type Search = { page?: number; search?: string };

const reducerFrom = (navigate: ReturnType<typeof vi.fn>) => navigate.mock.calls[navigate.mock.calls.length - 1][0].search as (prev: Search) => Search;

describe("useListControls", () => {
  it("search patches the search param, keeps the rest and starts from page one", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ navigate });

    controls.search("abba");

    expect(reducerFrom(navigate)({ page: 2 })).toEqual({ page: undefined, search: "abba" });
  });

  it("an empty search removes the search param", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ navigate });

    controls.search("");

    expect(reducerFrom(navigate)({ search: "abba" })).toStrictEqual({ page: undefined, search: undefined });
  });
});
