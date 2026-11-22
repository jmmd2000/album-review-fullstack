import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { morphProps } from "@/lib/coverMorph";
import { describeAmount, describeEntry, describePeriod, type ListeningKind, type TopEntry } from "@/lib/listening";
import { EntryImage, EntryScore, RankChange } from "@/components/listening/TopEntryRow";
import styles from "./SelectedEntry.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

interface SelectedEntryProps {
  selection: ListeningSelection;
  entry: TopEntry;
}

type EntryLink = { type: "artist"; id: string } | { type: "album"; id: string } | { type: "review"; id: string } | { type: "search"; query: string };

const LIST_TITLES: Record<ListeningKind, string> = { artists: "Top tracks", albums: "Top tracks", tracks: "Top tracks on its album", genres: "Top artists" };
const LIST_LENGTH = 5;

const day = (date: Date | string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

/**
 * More about one listening entry, as a band above the list: its image, rank, name, plays, minutes and first play,
 * then its top tracks or artists. The name links to the artist or album page.
 * The band keeps its height from one entry to the next, so the list below it doesn't move.
 */
export function SelectedEntry({ selection, entry }: SelectedEntryProps) {
  const { kind, period, by, from, to } = selection;
  const details = useQuery({
    queryKey: queryKeys.listening.entry(kind, entry.id, period, by, from, to),
    queryFn: () => handle(client.api.listening.entry.$get({ query: { kind, id: entry.id, period, by, ...(period === "custom" ? { from, to } : {}) } })),
    placeholderData: keepPreviousData,
  });
  // The last entry's details show while the next load, but its link must not
  const current = details.isPlaceholderData ? undefined : details.data;
  const items = kind === "genres" ? (details.data?.topArtists ?? []) : (details.data?.topTracks ?? []);
  const imageURLs = entry.largeImageURL ? [entry.largeImageURL] : entry.imageURLs;
  const link = current?.link ?? null;
  // The image flies into the artist or album page, the same as from a card elsewhere
  let morph: ReturnType<typeof morphProps> | undefined;
  if (link?.type === "artist") morph = morphProps("artist", link.id);
  if (link?.type === "album") morph = morphProps("album", link.id);

  return (
    <article className={styles.entry}>
      <EntryImage kind={kind} imageURLs={imageURLs} large morph={morph} />

      <div className={styles.text}>
        <p className={styles.rank}>
          #{entry.rank} {describePeriod(period, from, to)} by {by} <RankChange change={entry.change} />
          {entry.score !== null && <EntryScore kind={kind} score={entry.score} />}
        </p>
        <h2 className={styles.name}>
          <EntryName name={entry.name} link={link} />
        </h2>
        <p className={styles.detail}>{describeEntry(kind, entry)}</p>
        <dl className={styles.figures}>
          <div>
            <dt>Plays</dt>
            <dd>{entry.plays.toLocaleString("en-GB")}</dd>
          </div>
          <div>
            <dt>Minutes</dt>
            <dd>{entry.minutes.toLocaleString("en-GB")}</dd>
          </div>
          <div>
            <dt>First play</dt>
            <dd>{current?.firstPlayedAt ? day(current.firstPlayedAt) : "–"}</dd>
          </div>
          {kind === "genres" && (
            <div>
              <dt>Share of plays</dt>
              <dd>{current && current.share !== null ? `${Math.round(current.share * 100)}%` : "–"}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className={styles.side}>
        <div className={styles.list}>
          <p className={styles.label}>{LIST_TITLES[kind]}</p>
          <ol>
            {items.slice(0, LIST_LENGTH).map(item => (
              <li key={item.id}>
                {item.imageURL ? (
                  <img className={kind === "genres" ? styles.round : undefined} src={item.imageURL} alt="" width={36} height={36} loading="lazy" />
                ) : (
                  <span className={kind === "genres" ? styles.round : undefined} />
                )}
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemPlays}>{describeAmount(item[by], by)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

/** The entry's name, as a link to its page when it has one: the artist or album page, the album to review, or a search for the artist. */
function EntryName({ name, link }: { name: string; link: EntryLink | null }) {
  if (!link) return <>{name}</>;
  if (link.type === "artist") {
    return (
      <Link className={styles.nameLink} to="/artists/$artistID" params={{ artistID: link.id }}>
        {name}
      </Link>
    );
  }
  if (link.type === "album") {
    return (
      <Link className={styles.nameLink} to="/albums/$albumID" params={{ albumID: link.id }}>
        {name}
      </Link>
    );
  }
  if (link.type === "review") {
    return (
      <Link className={styles.nameLink} to="/albums/$albumID/create" params={{ albumID: link.id }}>
        {name}
      </Link>
    );
  }
  return (
    <Link className={styles.nameLink} to="/search" search={{ query: link.query }}>
      {name}
    </Link>
  );
}
