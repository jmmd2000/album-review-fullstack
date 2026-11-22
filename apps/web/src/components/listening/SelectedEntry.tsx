import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { describeEntry, describePeriod, type ListeningKind, type TopEntry } from "@/lib/listening";
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
const DAY_MS = 86400000;

const day = (date: Date | string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });
const shortDay = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Dublin" });
const countPlays = (plays: number) => (plays === 1 ? "1 play" : `${plays.toLocaleString("en-GB")} plays`);

/**
 * More about one listening entry, as a band above the list: its image, rank, name, plays, minutes and first play,
 * then its last 12 weeks and its top tracks or artists. The name links to the artist or album page.
 * The band keeps its height from one entry to the next, so the list below it doesn't move.
 */
export function SelectedEntry({ selection, entry }: SelectedEntryProps) {
  const { kind, period, by, from, to } = selection;
  const details = useQuery({
    queryKey: queryKeys.listening.entry(kind, entry.id, period, from, to),
    queryFn: () => handle(client.api.listening.entry.$get({ query: { kind, id: entry.id, period, ...(period === "custom" ? { from, to } : {}) } })),
    placeholderData: keepPreviousData,
  });
  // The last entry's details show while the next load, but its link must not
  const current = details.isPlaceholderData ? undefined : details.data;
  const items = kind === "genres" ? (details.data?.topArtists ?? []) : (details.data?.topTracks ?? []);
  const imageURLs = entry.largeImageURL ? [entry.largeImageURL] : entry.imageURLs;

  return (
    <article className={styles.entry}>
      <EntryImage kind={kind} imageURLs={imageURLs} large />

      <div className={styles.text}>
        <p className={styles.rank}>
          #{entry.rank} {describePeriod(period, from, to)} by {by} <RankChange change={entry.change} />
          {entry.score !== null && <EntryScore kind={kind} score={entry.score} />}
        </p>
        <h2 className={styles.name}>
          <EntryName name={entry.name} link={current?.link ?? null} />
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
        <WeeklyPlays weeks={details.data?.weeklyPlays ?? []} />
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
                <span className={styles.itemPlays}>{countPlays(item.plays)}</span>
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

/** Plays in each of the last 12 weeks. Pointing at a week shows its plays, and otherwise the busiest week shows. */
function WeeklyPlays({ weeks }: { weeks: number[] }) {
  const [pointed, setPointed] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const most = Math.max(0, ...weeks);
  const busiest = weeks.indexOf(most);
  // A week is the 7 days up to that point, and the last one ends now
  const weekEnd = (index: number) => new Date(now - (weeks.length - 1 - index) * 7 * DAY_MS);
  const describeWeek = (index: number) => `Week to ${shortDay(weekEnd(index))}: ${countPlays(weeks[index])}`;

  let readout = "No plays in the last 12 weeks";
  if (pointed !== null) readout = describeWeek(pointed);
  else if (most > 0) readout = `Busiest week to ${shortDay(weekEnd(busiest))}: ${countPlays(most)}`;

  return (
    <div className={styles.weeks}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Plays each week</span>
        <output className={styles.readout}>{weeks.length > 0 ? readout : ""}</output>
      </div>
      <ol className={styles.bars} data-pointing={pointed !== null} onMouseLeave={() => setPointed(null)}>
        {weeks.map((plays, index) => (
          <li
            key={index}
            tabIndex={0}
            aria-label={describeWeek(index)}
            data-pointed={pointed === index}
            onMouseEnter={() => setPointed(index)}
            onFocus={() => setPointed(index)}
            onBlur={() => setPointed(null)}
          >
            <span style={{ height: `${most > 0 ? (plays / most) * 100 : 0}%` }} />
          </li>
        ))}
      </ol>
    </div>
  );
}
