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
    pick: ["home", "pick"] as const,
  },
  auth: {
    status: ["auth", "status"] as const,
  },
  albums: {
    all: ["albums"] as const,
    list: (options: GetPaginatedAlbumsOptions) => ["albums", "list", options] as const,
    detail: (albumID: string) => ["albums", "detail", albumID] as const,
    related: (albumID: string) => ["albums", "related", albumID] as const,
    edit: (albumID: string) => ["albums", "edit", albumID] as const,
    create: (albumID: string) => ["albums", "create", albumID] as const,
  },
  artists: {
    all: ["artists"] as const,
    list: (options: GetPaginatedArtistsOptions) => ["artists", "list", options] as const,
    detail: (artistID: string) => ["artists", "detail", artistID] as const,
  },
  drafts: {
    all: ["drafts"] as const,
  },
  genreSuggestions: (albumID: string) => ["genre-suggestions", albumID] as const,
  bookmarks: {
    all: ["bookmarks"] as const,
    lists: ["bookmarks", "list"] as const,
    list: (options: GetPaginatedBookmarkedAlbumsOptions) => ["bookmarks", "list", options] as const,
  },
  discover: ["discover"] as const,
  search: {
    all: ["search"] as const,
    results: (options: SearchAlbumsOptions) => ["search", options] as const,
  },
  settings: {
    all: ["settings"] as const,
    lastRuns: ["settings", "lastRuns"] as const,
    jobResults: ["settings", "jobResults"] as const,
    jobIntervals: ["settings", "jobIntervals"] as const,
    buildInfo: ["settings", "buildInfo"] as const,
    listening: ["settings", "listening"] as const,
    playsInRange: (from: string, to: string) => ["settings", "playsInRange", from, to] as const,
  },
  listening: {
    top: (kind: string, period: string, from?: string, to?: string) => ["listening", "top", kind, period, from ?? "", to ?? ""] as const,
    overTime: (period: string, from?: string, to?: string) => ["listening", "overTime", period, from ?? "", to ?? ""] as const,
    entry: (kind: string, id: string, period: string, from?: string, to?: string) => ["listening", "entry", kind, id, period, from ?? "", to ?? ""] as const,
  },
  stats: {
    all: ["stats"] as const,
    overview: ["stats", "overview"] as const,
  },
};
