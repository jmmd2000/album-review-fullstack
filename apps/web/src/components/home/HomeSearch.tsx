import { useState } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { morphProps } from "@/lib/coverMorph";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./HomeSearch.module.css";

import type { HomeSearchResult, SpotifyImage } from "@shared/types";

const homeSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: queryKeys.home.search(query),
    queryFn: () => handle(client.api.home.search.$get({ query: { query } })),
  });

/** The thumbnail is 44px, so this covers a 2x screen */
const THUMBNAIL_WIDTH = 88;

function plural(count: number, word: string): string {
  return `${count.toLocaleString("en-GB")} ${word}${count === 1 ? "" : "s"}`;
}

/** The smallest image that still looks sharp as a thumbnail. Spotify lists images largest first. */
function thumbnailOf(images: SpotifyImage[]): SpotifyImage | undefined {
  const sharpImages = images.filter(image => image.width >= THUMBNAIL_WIDTH);
  return sharpImages[sharpImages.length - 1] ?? images[0];
}

interface HomeSearchProps {
  albumCount: number;
  artistCount: number;
}

/**
 * The home page's search. Up to five artists and albums show in a list as you type.
 * The top one is highlighted, so Enter opens it, and the arrow keys move the highlight.
 */
export function HomeSearch({ albumCount, artistCount }: HomeSearchProps) {
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), 150);
  const results = useQuery({ ...homeSearchQueryOptions(query), enabled: query !== "", placeholderData: keepPreviousData });

  const items = text.trim() === "" ? [] : (results.data ?? []);
  // Says nothing matches only once the results for the current text are in
  const isSettled = query === text.trim() && results.isSuccess && !results.isPlaceholderData;

  function getStatus(): string | null {
    if (text.trim() === "") return null;
    if (results.isError) return "The search isn't working. Try again.";
    if (isSettled && items.length === 0) return "Nothing called that yet.";
    return null;
  }
  const status = getStatus();

  return (
    <div role="search" className={styles.search}>
      <Autocomplete.Root items={items} filter={null} value={text} onValueChange={setText} itemToStringValue={(result: HomeSearchResult) => result.name} autoHighlight="always">
        <div className={styles.field}>
          <MagnifyingGlassIcon className={styles.icon} weight="bold" aria-hidden="true" />
          <Autocomplete.Input
            className={styles.input}
            type="search"
            aria-label="Search albums and artists"
            placeholder={`Search ${plural(albumCount, "album")} and ${plural(artistCount, "artist")}`}
          />
        </div>
        <Autocomplete.Portal hidden={items.length === 0 && status === null}>
          <Autocomplete.Positioner className={styles.positioner} sideOffset={8} align="start">
            <Autocomplete.Popup className={styles.popup}>
              <Autocomplete.Status className={styles.status}>{status}</Autocomplete.Status>
              <Autocomplete.List>
                {(result: HomeSearchResult) => {
                  const thumbnail = thumbnailOf(result.imageURLs);
                  const thumbnailClass = result.type === "artist" ? `${styles.thumbnail} ${styles.round}` : styles.thumbnail;
                  const link =
                    result.type === "album"
                      ? ({ to: "/albums/$albumID", params: { albumID: result.spotifyID } } as const)
                      : ({ to: "/artists/$artistID", params: { artistID: result.spotifyID } } as const);

                  return (
                    <Autocomplete.Item key={`${result.type}-${result.spotifyID}`} value={result} className={styles.item} render={<Link {...link} />}>
                      {thumbnail ? (
                        <img className={thumbnailClass} src={thumbnail.url} alt="" width={44} height={44} {...morphProps(result.type, result.spotifyID, false)} />
                      ) : (
                        <span className={thumbnailClass} />
                      )}
                      <span className={styles.text}>
                        <span className={styles.name}>{result.name}</span>
                        <span className={styles.subtitle}>{result.type === "album" ? `${result.artistName} · ${result.releaseYear}` : `Artist · ${plural(result.albumCount, "album")}`}</span>
                      </span>
                      <ScoreChip score={result.score} />
                    </Autocomplete.Item>
                  );
                }}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </div>
  );
}
