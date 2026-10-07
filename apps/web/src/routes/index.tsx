import { useCallback, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { usableCoverColours } from "@/lib/coverColours";
import { CoverColumns } from "@/components/home/CoverColumns";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./index.module.css";

import type { CSSProperties } from "react";
import type { HomeAlbum } from "@shared/types";

const homeQueryOptions = queryOptions({
  queryKey: queryKeys.home.overview,
  queryFn: () => handle(client.api.home.$get()),
  // A new sample would swap every cover on screen, so it stays until the page reloads
  staleTime: Infinity,
});

export const Route = createFileRoute("/")({
  ssr: true,
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
  head: () => ({
    meta: socialMeta({
      title: "JamesReviewsMusic",
      description: "This is my album review blog, where I share my thoughts on a variety of albums and artists.",
    }),
  }),
  component: Index,
});

interface HoveredAlbum {
  album: HomeAlbum;
  /** The cover's most vivid colour, if it has one that shows on the page */
  colour: string | undefined;
}

function Index() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<HoveredAlbum | null>(null);
  // The tint keeps the last colour while it fades out
  const [tintColour, setTintColour] = useState<string | null>(null);

  const showAlbum = useCallback((album: HomeAlbum | null) => {
    if (!album) {
      setHovered(null);
      return;
    }
    const colour = usableCoverColours(album.colors)[0];
    setHovered({ album, colour });
    if (colour) setTintColour(colour);
  }, []);

  const shuffle = () => {
    const album = data.albums[Math.floor(Math.random() * data.albums.length)];
    if (album) navigate({ to: "/albums/$albumID", params: { albumID: album.spotifyID } });
  };

  const tintStyle = tintColour ? ({ "--tint": tintColour } as CSSProperties) : undefined;

  return (
    <div className={styles.home}>
      <div className={styles.tint} style={tintStyle} data-lit={hovered?.colour ? "" : undefined} aria-hidden="true" />
      <section className={styles.intro}>
        <div className={styles.heading}>
          <h1 className={styles.title}>
            James
            <br />
            Reviews
            <br />
            Music
          </h1>
          <p className={styles.now}>
            {hovered && (
              <>
                <ScoreChip score={hovered.album.finalScore} />
                <span>
                  <b className={styles.nowName}>{hovered.album.name}</b>
                  {hovered.album.artistName}, {hovered.album.releaseYear}
                </span>
              </>
            )}
          </p>
        </div>
        <div className={styles.actions}>
          <HomeSearch albumCount={data.albumCount} artistCount={data.artistCount} />
          <div className={styles.buttons}>
            {data.albums.length > 0 && <Button onClick={shuffle}>Shuffle</Button>}
            {data.latestAlbumID && (
              <ButtonLink variant="primary" to="/albums/$albumID" params={{ albumID: data.latestAlbumID }}>
                Latest review
              </ButtonLink>
            )}
          </div>
        </div>
      </section>
      <div className={styles.wall}>
        <CoverColumns albums={data.albums} onHover={showAlbum} />
      </div>
    </div>
  );
}
