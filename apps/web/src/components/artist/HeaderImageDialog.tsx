import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@base-ui/react/dialog";
import { ApiError, client, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import dialog from "@/styles/dialog.module.css";
import styles from "./HeaderImageDialog.module.css";

const COPY_HEADER_SCRIPT = `document.querySelector('[data-testid="background-image"]').style.backgroundImage.slice(5, -2)`;

interface HeaderImageDialogProps {
  artistID: string;
  headerImage: string | null;
}

/** A button that opens a dialog to set or remove an artist's header image by its link. */
export function HeaderImageDialog({ artistID, headerImage }: HeaderImageDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (url: string) => handleVoid(client.api.artists[":artistID"].headerImage.$put({ param: { artistID }, json: { headerImage: url || null } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      setOpen(false);
    },
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={nextOpen => {
        if (update.isPending) return;
        setOpen(nextOpen);
        if (!nextOpen) update.reset();
      }}
    >
      <Dialog.Trigger render={<Button variant="secondary" />}>Change header</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialog.backdrop} />
        <Dialog.Popup className={`${dialog.popup} ${styles.popup}`}>
          <Dialog.Title className={dialog.title}>Change the header</Dialog.Title>
          <form
            className={styles.form}
            onSubmit={event => {
              event.preventDefault();
              const url = new FormData(event.currentTarget).get("headerImage");
              update.mutate(typeof url === "string" ? url.trim() : "");
            }}
          >
            <label className={styles.label} htmlFor="header-image-url">
              Image link
            </label>
            <Input id="header-image-url" name="headerImage" type="url" defaultValue={headerImage ?? ""} placeholder="https://i2o.scdn.co/image/…" disabled={update.isPending} />
            <Dialog.Description className={dialog.description}>
              Leave it empty to remove the header. To get the link, open the artist on Spotify and run this in the browser console:
            </Dialog.Description>
            <code className={styles.script}>{COPY_HEADER_SCRIPT}</code>
            {update.isError && (
              <p className={dialog.error} role="alert">
                {update.error instanceof ApiError ? update.error.message : "The header couldn't be saved. Try again."}
              </p>
            )}
            <div className={dialog.actions}>
              <Dialog.Close render={<Button variant="secondary" />} disabled={update.isPending}>
                Cancel
              </Dialog.Close>
              <Button type="submit" variant="primary" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
