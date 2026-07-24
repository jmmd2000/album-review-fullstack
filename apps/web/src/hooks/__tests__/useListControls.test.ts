import { describe, it, expect, vi } from "vitest";
import { useListControls } from "@/hooks/useListControls";

type Search = { page?: number; search?: string };

const reducerFrom = (navigate: ReturnType<typeof vi.fn>) => navigate.mock.calls[navigate.mock.calls.length - 1][0].search as (prev: Search) => Search;

describe("useListControls", () => {
  it("search patches the search param and keeps the rest", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ page: 2, data: { totalCount: 80, furtherPages: true }, navigate });

    controls.search("abba");

    expect(reducerFrom(navigate)({ page: 2 })).toEqual({ page: 2, search: "abba" });
  });

  it("next advances the page when further pages exist", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ page: 2, data: { totalCount: 80, furtherPages: true }, navigate });

    controls.pagination.next.action();

    expect(reducerFrom(navigate)({ page: 2 })).toEqual({ page: 3 });
    expect(controls.pagination.next.disabled).toBe(false);
  });

  it("next does nothing on the last page", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ page: 3, data: { totalCount: 80, furtherPages: false }, navigate });

    controls.pagination.next.action();

    expect(navigate).not.toHaveBeenCalled();
    expect(controls.pagination.next.disabled).toBe(true);
  });

  it("prev steps back and clamps at page one", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ page: 2, data: { totalCount: 80, furtherPages: true }, navigate });

    controls.pagination.prev.action();
    const reducer = reducerFrom(navigate);

    expect(reducer({ page: 2 })).toEqual({ page: 1 });
    const atStart = { page: 1 };
    expect(reducer(atStart)).toBe(atStart);
  });

  it("prev is disabled on the first page and without a page param", () => {
    const navigate = vi.fn();
    const first = useListControls<Search>({ page: 1, data: { totalCount: 80, furtherPages: true }, navigate });
    const unset = useListControls<Search>({ page: undefined, data: { totalCount: 80, furtherPages: true }, navigate });

    expect(first.pagination.prev.disabled).toBe(true);
    expect(unset.pagination.prev.disabled).toBe(true);
  });

  it("computes the page position from the totals", () => {
    const navigate = vi.fn();
    const controls = useListControls<Search>({ page: undefined, data: { totalCount: 80, furtherPages: true }, navigate });

    expect(controls.pagination.page.pageNumber).toBe(1);
    // 80 rows over 35 a page rounds up to 3 pages
    expect(controls.pagination.page.totalPages).toBe(3);
  });
});
