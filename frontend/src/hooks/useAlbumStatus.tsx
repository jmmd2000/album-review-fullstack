import { useQuery } from "@tanstack/react-query";
import { DisplayAlbum } from "@shared/types";
import { api } from "@/lib/api";

export function useAlbumStatus(albums: DisplayAlbum[]) {
  const ids = albums.map(a => a.spotifyID);
  const qs = new URLSearchParams(ids.map(id => Array.from(["ids", id]))).toString();

  // Bookmark‐status query
  const { data: bookmarkData = {}, isLoading: isLoadingBookmarks } = useQuery<
    Record<string, boolean>,
    Error
  >({
    queryKey: ["bookmarks", ids],
    queryFn: async () => {
      return api.get<Record<string, boolean>>(`/api/bookmarks/status?${qs}`);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  // review‐score query
  const { data: scoreArray = [], isLoading: isLoadingScores } = useQuery<
    Array<{ spotifyID: string; reviewScore: number }>,
    Error
  >({
    queryKey: ["albums", "status", ids],
    queryFn: async () => {
      return api.get<Array<{ spotifyID: string; reviewScore: number }>>(
        `/api/albums/status?${qs}`
      );
    },
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
    isError: false, // you can combine bookmarkData and scoreArray errors if you wish
  };
}
