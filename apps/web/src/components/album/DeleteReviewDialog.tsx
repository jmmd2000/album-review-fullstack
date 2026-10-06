import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { client, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import styles from "./DeleteReviewDialog.module.css";

interface DeleteReviewDialogProps {
  albumID: string;
  albumName: string;
  triggerClassName?: string;
}

/**
 * A Delete button that opens a dialog to confirm the delete. After the delete, it opens
 * the albums list and refreshes the album, artist, stats and home data.
 */
export function DeleteReviewDialog({ albumID, albumName, triggerClassName }: DeleteReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deletion = useMutation({
    mutationFn: () => handleVoid(client.api.albums[":albumID"].$delete({ param: { albumID } })),
    onSuccess: async () => {
      // Leave the page first. If the page stays open, its query fetches the deleted album and shows "Album not found".
      await navigate({ to: "/albums" });
      queryClient.removeQueries({ queryKey: queryKeys.albums.detail(albumID) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.home }),
      ]);
    },
  });

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={nextOpen => {
        if (deletion.isPending) return;
        setOpen(nextOpen);
        if (!nextOpen) deletion.reset();
      }}
    >
      <AlertDialog.Trigger className={triggerClassName}>Delete</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.backdrop} />
        <AlertDialog.Popup className={styles.popup}>
          <AlertDialog.Title className={styles.title}>Delete this review?</AlertDialog.Title>
          <AlertDialog.Description className={styles.description}>{albumName}, its score and its track ratings will be removed. This can't be undone.</AlertDialog.Description>
          {deletion.isError && (
            <p className={styles.error} role="alert">
              The review couldn't be deleted. Try again.
            </p>
          )}
          <div className={styles.actions}>
            <AlertDialog.Close render={<Button variant="secondary" />} disabled={deletion.isPending}>
              Cancel
            </AlertDialog.Close>
            <Button variant="primary" onClick={() => deletion.mutate()} disabled={deletion.isPending}>
              {deletion.isPending ? "Deleting…" : "Delete review"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
