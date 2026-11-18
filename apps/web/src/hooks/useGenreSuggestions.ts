import { useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Genres MusicBrainz suggests for the album, loaded on their own so the form never waits for them.
 * Each album is looked up once a visit, and an empty list comes back while loading or after a failure.
 */
export function useGenreSuggestions(albumID: string) {
  const { data } = useQuery({
    queryKey: queryKeys.genreSuggestions(albumID),
    queryFn: () => handle(client.api.spotify.albums[":albumID"]["genre-suggestions"].$get({ param: { albumID } })),
    staleTime: Infinity,
    retry: false,
  });
  return data?.suggestions ?? [];
}
