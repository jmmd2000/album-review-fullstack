import { Link } from "@tanstack/react-router";
import { PreviewCard } from "@base-ui/react/preview-card";
import { AlbumHoverCard } from "@/components/album/AlbumHoverCard";
import styles from "./AlbumMention.module.css";

import type { ReactNode } from "react";
import type { LinkedAlbum } from "@shared/types";

interface AlbumMentionProps {
  album: LinkedAlbum;
  children: ReactNode;
}

/** An album named in a review: a link to the album that shows its hovercard on hover or focus. */
export function AlbumMention({ album, children }: AlbumMentionProps) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger delay={250} closeDelay={100} render={<Link to="/albums/$albumID" params={{ albumID: album.spotifyID }} className={styles.mention} />}>
        {children}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner className={styles.positioner} sideOffset={8}>
          <PreviewCard.Popup className={styles.popup}>
            <AlbumHoverCard album={album} />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
