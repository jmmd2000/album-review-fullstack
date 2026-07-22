import { useQuery } from "@tanstack/react-query";
import type { DisplayAlbum } from "@shared/types";
import { client, handle } from "@/lib/client";

export function useAlbumStatus(albums: DisplayAlbum[]) {
  const ids = albums.map(a => a.spotifyID);

  // Bookmark‐status query
  const {
    data: bookmarkData = {},
    isLoading: isLoadingBookmarks,
    isError: isBookmarksError,
  } = useQuery({
    queryKey: ["bookmarks", ids],
    queryFn: () => handle(client.api.bookmarks.status.$get({ query: { ids } })),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  // review‐score query
  const {
    data: scoreArray = [],
    isLoading: isLoadingScores,
    isError: isScoresError,
  } = useQuery({
    queryKey: ["albums", "scores", ids],
    queryFn: () => handle(client.api.albums.scores.$get({ query: { ids: ids.join(",") } })),
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
  };
}
