import { useQuery } from "@tanstack/react-query";
import type { DisplayAlbum } from "@shared/types";
import { useAuth } from "@/auth/useAuth";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";

export function useAlbumStatus(albums: DisplayAlbum[]) {
  const { isAdmin } = useAuth();
  const ids = albums.map(a => a.spotifyID);

  // Bookmark-status query. The endpoint is admin only, so it never fires for
  // anonymous visitors, and an empty album list has nothing to ask about
  const {
    data: bookmarkData = {},
    isLoading: isLoadingBookmarks,
    isError: isBookmarksError,
    error: bookmarksError,
  } = useQuery({
    queryKey: queryKeys.bookmarks.status(ids),
    queryFn: () => handle(client.api.bookmarks.status.$get({ query: { ids } })),
    enabled: isAdmin && ids.length > 0,
    staleTime: 30_000,
  });

  // review-score query
  const {
    data: scoreArray = [],
    isLoading: isLoadingScores,
    isError: isScoresError,
    error: scoresError,
  } = useQuery({
    queryKey: queryKeys.albums.scores(ids),
    queryFn: () => handle(client.api.albums.scores.$get({ query: { ids: ids.join(",") } })),
    enabled: ids.length > 0,
    // scores rarely change so no need to auto refetch
    staleTime: Infinity,
  });

  // Turn array into a lookup
  const scoreMap: Record<string, number> = {};
  for (const { spotifyID, reviewScore } of scoreArray) {
    scoreMap[spotifyID] = reviewScore;
  }

  // Merge into albums
  const enriched = albums.map(album => ({
    ...album,
    bookmarked: Boolean(bookmarkData[album.spotifyID]),
    // override or fill in the score from cache
    finalScore: scoreMap[album.spotifyID] ?? album.finalScore,
  }));

  return {
    data: enriched,
    isLoading: isLoadingBookmarks || isLoadingScores,
    isError: isBookmarksError || isScoresError,
    error: bookmarksError ?? scoresError,
  };
}
