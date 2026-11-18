import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { loadPageQuery } from "@/lib/loadPageQuery";

function pageQuery(fetchPage: () => Promise<string>) {
  return { queryKey: ["albums", "detail", "album-1"], queryFn: fetchPage, staleTime: Infinity };
}

describe("loadPageQuery", () => {
  it("fetches when nothing is cached", async () => {
    const queryClient = new QueryClient();
    const fetchPage = vi.fn().mockResolvedValue("first");

    expect(await loadPageQuery(queryClient, pageQuery(fetchPage))).toBe("first");
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("returns the cached copy at once, then swaps in the newer one", async () => {
    const queryClient = new QueryClient();
    const fetchPage = vi.fn().mockResolvedValueOnce("before edit").mockResolvedValueOnce("after edit");
    await loadPageQuery(queryClient, pageQuery(fetchPage));

    expect(await loadPageQuery(queryClient, pageQuery(fetchPage))).toBe("before edit");
    await vi.waitFor(() => expect(queryClient.getQueryData(["albums", "detail", "album-1"])).toBe("after edit"));
  });

  it("fetches again before returning once the cached copy is marked out of date", async () => {
    const queryClient = new QueryClient();
    const fetchPage = vi.fn().mockResolvedValueOnce("before edit").mockResolvedValueOnce("after edit");
    await loadPageQuery(queryClient, pageQuery(fetchPage));

    await queryClient.invalidateQueries({ queryKey: ["albums"] });

    expect(await loadPageQuery(queryClient, pageQuery(fetchPage))).toBe("after edit");
  });
});
