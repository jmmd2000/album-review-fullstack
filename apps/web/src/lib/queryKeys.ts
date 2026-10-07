import type { GetPaginatedAlbumsOptions, GetPaginatedArtistsOptions, GetPaginatedBookmarkedAlbumsOptions, SearchAlbumsOptions } from "@shared/types";

/**
 * Every query key in the app. Roots prefix their children, so invalidating
 * `albums.all` covers the list, details, edit and create pages in one call,
 * and the same goes for `artists` and `bookmarks`.
 */
export const queryKeys = {
  home: {
    all: ["home"] as const,
    overview: ["home", "overview"] as const,
    search: (query: string) => ["home", "search", query] as const,
  },
  auth: {
    status: ["auth", "status"] as const,
  },
  albums: {
    all: ["albums"] as const,
    list: (options: GetPaginatedAlbumsOptions) => ["albums", "list", options] as const,
    detail: (albumID: string) => ["albums", "detail", albumID] as const,
    edit: (albumID: string) => ["albums", "edit", albumID] as const,
    create: (albumID: string) => ["albums", "create", albumID] as const,
  },
  artists: {
    all: ["artists"] as const,
    list: (options: GetPaginatedArtistsOptions) => ["artists", "list", options] as const,
    detail: (artistID: string) => ["artists", "detail", artistID] as const,
  },
  bookmarks: {
    all: ["bookmarks"] as const,
    lists: ["bookmarks", "list"] as const,
    list: (options: GetPaginatedBookmarkedAlbumsOptions) => ["bookmarks", "list", options] as const,
  },
  search: {
    all: ["search"] as const,
    results: (options: SearchAlbumsOptions) => ["search", options] as const,
  },
  settings: {
    lastRuns: ["settings", "lastRuns"] as const,
    jobResults: ["settings", "jobResults"] as const,
    refreshInterval: ["settings", "refreshInterval"] as const,
    buildInfo: ["settings", "buildInfo"] as const,
  },
  stats: {
    all: ["stats"] as const,
    overview: ["stats", "overview"] as const,
  },
};
