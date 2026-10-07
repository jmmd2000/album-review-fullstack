import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { client, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { IconButton } from "@/components/ui/IconButton";
import styles from "./BookmarkButton.module.css";

import type { DisplayAlbum } from "@shared/types";

interface BookmarkButtonProps {
  album: DisplayAlbum;
  bookmarked: boolean;
}

/**
 * Adds an album to the bookmarks or removes it. The button shows the new state at once.
 * If the request fails, it goes back to the old state and shows a toast.
 */
export function BookmarkButton({ album, bookmarked }: BookmarkButtonProps) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? handleVoid(client.api.bookmarks[":albumID"].add.$post({ param: { albumID: album.spotifyID }, json: album }))
        : handleVoid(client.api.bookmarks[":albumID"].remove.$delete({ param: { albumID: album.spotifyID } })),
    onSuccess: (_result, next) => {
      queryClient.setQueriesData<DisplayAlbum[]>({ queryKey: queryKeys.search.all }, results =>
        results?.map(result => (result.spotifyID === album.spotifyID ? { ...result, bookmarked: next } : result))
      );
    },
    onError: () => toast.error("The bookmark couldn't be saved. Try again."),
    // Returning the refetch keeps the mutation pending until the bookmarks list has the new state, so the button doesn't flick back
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all }),
  });

  const shownBookmarked = toggle.isPending ? toggle.variables : bookmarked;

  return (
    <IconButton className={styles.button} aria-label={`Bookmark ${album.name}`} aria-pressed={shownBookmarked} disabled={toggle.isPending} onClick={() => toggle.mutate(!shownBookmarked)}>
      <BookmarkSimpleIcon weight={shownBookmarked ? "fill" : "bold"} aria-hidden="true" />
    </IconButton>
  );
}
