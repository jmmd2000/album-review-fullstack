import { useQuery } from "@tanstack/react-query";
import { linkOptions } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { usableCoverColours } from "@/lib/coverColours";
import { queryKeys } from "@/lib/queryKeys";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import styles from "./NotFound.module.css";

import type { ReactNode } from "react";

interface NotFoundProps {
  title?: string;
  /** A line under the title on why the page isn't there */
  detail?: string;
  /** A way back that replaces the Home link, such as a link to the albums */
  children?: ReactNode;
}

/**
 * The page for a link that leads nowhere. It offers a random album instead, with a button to pick another.
 * Without an album to offer, it shows only the message and the way back.
 */
export function NotFound({ title = "That page doesn't exist.", detail, children }: NotFoundProps) {
  const {
    data: album,
    isPending,
    refetch,
  } = useQuery({
    queryKey: queryKeys.home.pick,
    queryFn: () => handle(client.api.home.pick.$get()),
    // Each pick stays put until "Another" asks for a new one, and a later visit to this page gets a fresh pick
    staleTime: Infinity,
    gcTime: 0,
  });
  // The pick loads in the browser, so its line and button hold their space until it arrives, and nothing moves when it does
  const offerShown = isPending || album !== null;

  return (
    <section className={styles.page}>
      <div className={styles.message}>
        <h1 className={styles.title}>{title}</h1>
        {detail && <p className={styles.detail}>{detail}</p>}
        {offerShown && <p className={album ? styles.offer : `${styles.offer} ${styles.waiting}`}>Here's a random one instead.</p>}
        <div className={styles.actions}>
          {children ?? (
            <ButtonLink to="/" variant="secondary">
              Home
            </ButtonLink>
          )}
          {offerShown && (
            <button type="button" className={album ? styles.another : `${styles.another} ${styles.waiting}`} disabled={!album} onClick={() => void refetch()}>
              Another
            </button>
          )}
        </div>
      </div>
      {album && (
        <ul className={styles.pick} aria-live="polite">
          <Card
            key={album.spotifyID}
            link={linkOptions({ to: "/albums/$albumID", params: { albumID: album.spotifyID } })}
            title={album.name}
            subtitle={album.artistName}
            score={album.finalScore}
            images={album.imageURLs}
            shade={usableCoverColours(album.colors)[0]}
            morph={{ kind: "album", spotifyID: album.spotifyID }}
          />
        </ul>
      )}
    </section>
  );
}
