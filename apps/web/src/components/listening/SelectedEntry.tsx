import { useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { describeEntry, describePeriod, type ListeningKind, type TopEntry } from "@/lib/listening";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { EntryImage, RankChange } from "@/components/listening/TopEntryRow";
import styles from "./SelectedEntry.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

interface SelectedEntryProps {
  selection: ListeningSelection;
  entry: TopEntry;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });
const LINK_LABELS: Record<ListeningKind, string> = { artists: "Artist page", albums: "Album page", tracks: "Album page", genres: "" };

/** More about one listening entry: rank, plays, minutes, first play, the last 12 weeks, its top tracks or artists, and a link. */
export function SelectedEntry({ selection, entry }: SelectedEntryProps) {
  const { kind, period, from, to } = selection;
  const details = useQuery({
    queryKey: queryKeys.listening.entry(kind, entry.id, period, from, to),
    queryFn: () => handle(client.api.listening.entry.$get({ query: { kind, id: entry.id, period, ...(period === "custom" ? { from, to } : {}) } })),
  });
  const weeks = details.data?.weeklyPlays ?? [];
  const mostInAWeek = Math.max(1, ...weeks);
  const link = details.data?.link ?? null;

  return (
    <article className={styles.entry}>
      <EntryImage kind={kind} imageURLs={entry.largeImageURL ? [entry.largeImageURL] : entry.imageURLs} large />
      <p className={styles.rank}>
        #{entry.rank} {describePeriod(period, from, to)} <RankChange change={entry.change} />
      </p>
      <h2 className={styles.name}>{entry.name}</h2>
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
          <dd>{details.data?.firstPlayedAt ? day(details.data.firstPlayedAt) : "–"}</dd>
        </div>
      </dl>

      <div className={styles.weeks}>
        <p className={styles.label}>Plays each week, last 12 weeks</p>
        <div className={styles.bars} role="img" aria-label={`Plays each week: ${weeks.join(", ")}`}>
          {weeks.map((plays, index) => (
            <span key={index} style={{ height: `${(plays / mostInAWeek) * 100}%` }} />
          ))}
        </div>
      </div>

      {details.data && details.data.share !== null && <p className={styles.share}>{Math.round(details.data.share * 100)}% of all plays</p>}
      <EntryList title={kind === "genres" ? "Top artists" : "Top tracks"} items={kind === "genres" ? (details.data?.topArtists ?? []) : (details.data?.topTracks ?? [])} round={kind === "genres"} />

      {link && (
        <div className={styles.link}>
          {link.type === "artist" && (
            <ButtonLink to="/artists/$artistID" params={{ artistID: link.id }} variant="primary">
              {LINK_LABELS[kind]} {entry.score !== null && <ScoreChip score={entry.score} />}
            </ButtonLink>
          )}
          {link.type === "album" && (
            <ButtonLink to="/albums/$albumID" params={{ albumID: link.id }} variant="primary">
              {LINK_LABELS[kind]} {kind === "albums" && entry.score !== null && <ScoreChip score={entry.score} />}
            </ButtonLink>
          )}
          {link.type === "review" && (
            <ButtonLink to="/albums/$albumID/create" params={{ albumID: link.id }} variant="primary">
              Review the album
            </ButtonLink>
          )}
          {link.type === "search" && (
            <ButtonLink to="/search" search={{ query: link.query }} variant="primary">
              Find an album to review
            </ButtonLink>
          )}
        </div>
      )}
    </article>
  );
}

function EntryList({ title, items, round }: { title: string; items: { id: string; name: string; imageURL: string | null; plays: number }[]; round: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.list}>
      <p className={styles.label}>{title}</p>
      <ol>
        {items.map(item => (
          <li key={item.id}>
            {item.imageURL ? (
              <img className={round ? styles.round : undefined} src={item.imageURL} alt="" width={36} height={36} loading="lazy" />
            ) : (
              <span className={round ? styles.round : undefined} />
            )}
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemPlays}>{item.plays === 1 ? "1 play" : `${item.plays.toLocaleString("en-GB")} plays`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
