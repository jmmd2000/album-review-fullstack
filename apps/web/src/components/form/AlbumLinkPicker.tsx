import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import styles from "./AlbumLinkPicker.module.css";

import type { RefObject } from "react";
import type { DisplayAlbum } from "@shared/types";

/** The most albums the picker lists */
const RESULT_LIMIT = 6;

interface AlbumLinkPickerProps {
  /** The text to link, or null while the picker is closed */
  selectedText: string | null;
  /** Asks to open the picker. The caller opens it only when there is text selected. */
  onOpenRequest: () => void;
  onClose: () => void;
  onPick: (album: DisplayAlbum) => void;
  /** Where the focus goes when the picker closes */
  returnFocusTo: RefObject<HTMLElement | null>;
}

/** The review toolbar's Album button. It opens a search of reviewed albums, and picking one links the selected text to it. */
export function AlbumLinkPicker({ selectedText, onOpenRequest, onClose, onPick, returnFocusTo }: AlbumLinkPickerProps) {
  return (
    <Popover.Root open={selectedText !== null} onOpenChange={open => (open ? onOpenRequest() : onClose())}>
      <Popover.Trigger className={styles.trigger}>Album</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={styles.positioner} side="bottom" align="start" sideOffset={8}>
          <Popover.Popup className={styles.popup} finalFocus={returnFocusTo}>
            {selectedText !== null && <AlbumSearch initialText={selectedText} onPick={onPick} />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface AlbumSearchProps {
  initialText: string;
  onPick: (album: DisplayAlbum) => void;
}

function AlbumSearch({ initialText, onPick }: AlbumSearchProps) {
  const [text, setText] = useState(initialText.trim());
  const search = useDebouncedValue(text.trim(), 150);
  const results = useQuery({
    queryKey: queryKeys.albums.list({ search }),
    queryFn: () => handle(client.api.albums.$get({ query: { search } })),
    enabled: search !== "",
    placeholderData: keepPreviousData,
  });
  const albums = text.trim() === "" ? [] : (results.data?.albums ?? []).slice(0, RESULT_LIMIT);

  return (
    <div className={styles.search}>
      <input
        className={styles.input}
        type="search"
        aria-label="Search reviewed albums"
        placeholder="Search reviewed albums"
        value={text}
        autoFocus
        onChange={event => setText(event.currentTarget.value)}
        onKeyDown={event => {
          if (event.key === "Enter" && albums[0]) {
            event.preventDefault();
            onPick(albums[0]);
          }
        }}
      />
      {albums.length > 0 && (
        <ul className={styles.results}>
          {albums.map(album => (
            <li key={album.spotifyID}>
              <button type="button" className={styles.result} onClick={() => onPick(album)}>
                {album.imageURLs.at(-1) ? <img src={album.imageURLs.at(-1)!.url} alt="" width={36} height={36} /> : <span />}
                <span className={styles.resultText}>
                  <b>{album.name}</b>
                  <span>
                    {album.artistName}, {album.releaseYear}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.isSuccess && search === text.trim() && albums.length === 0 && text.trim() !== "" && <p className={styles.status}>No reviewed album matches that.</p>}
      {results.isError && <p className={styles.status}>The search isn&apos;t working. Try again.</p>}
    </div>
  );
}
