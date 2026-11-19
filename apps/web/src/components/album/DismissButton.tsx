import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "@phosphor-icons/react";
import { client, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { IconButton } from "@/components/ui/IconButton";
import styles from "./DismissButton.module.css";

import type { DisplayAlbum } from "@shared/types";

/** Dismisses a suggested album, so it leaves the page and is never suggested again. */
export function DismissButton({ album }: { album: DisplayAlbum }) {
  const queryClient = useQueryClient();

  const dismiss = useMutation({
    mutationFn: () => handleVoid(client.api.discover.dismissed[":albumID"].$post({ param: { albumID: album.spotifyID } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discover }),
    onError: () => toast.error("The album couldn't be dismissed. Try again."),
  });

  return (
    <IconButton className={styles.button} aria-label={`Dismiss ${album.name}`} disabled={dismiss.isPending} onClick={() => dismiss.mutate()}>
      <XIcon weight="bold" aria-hidden="true" />
    </IconButton>
  );
}
