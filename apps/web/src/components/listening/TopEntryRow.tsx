import { scoreTier } from "@shared/helpers/ratingTiers";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { TierWordChip } from "@/components/ui/TierWordChip";
import styles from "./TopEntryRow.module.css";

import type { ListeningKind, TopEntry } from "@/lib/listening";

interface TopEntryRowProps {
  kind: ListeningKind;
  entry: TopEntry;
}

function describeChange(change: TopEntry["change"]) {
  if (change === null) return null;
  if (change === "new") return <span className={styles.new}>New</span>;
  if (change === 0) return <span className={styles.same}>–</span>;
  if (change > 0) return <span className={styles.up}>▲ {change}</span>;
  return <span className={styles.down}>▼ {-change}</span>;
}

function describeEntry(kind: ListeningKind, entry: TopEntry): string {
  if (kind === "artists") return entry.albumCount === 1 ? "1 album played" : `${entry.albumCount ?? 0} albums played`;
  return entry.artistNames.join(", ");
}

/** One ranked artist, track, album or genre: its rank and change, image, name, plays and score. */
export function TopEntryRow({ kind, entry }: TopEntryRowProps) {
  return (
    <li className={styles.row}>
      <span className={styles.rank}>
        {entry.rank}
        {describeChange(entry.change)}
      </span>
      <EntryImage kind={kind} imageURLs={entry.imageURLs} />
      <span className={styles.text}>
        <span className={styles.name}>{entry.name}</span>
        <span className={styles.detail}>{describeEntry(kind, entry)}</span>
      </span>
      <span className={styles.plays}>
        <b>{entry.plays.toLocaleString("en-GB")}</b> {entry.plays === 1 ? "play" : "plays"}
      </span>
      <span className={styles.score}>{entry.score !== null && <EntryScore kind={kind} score={entry.score} />}</span>
    </li>
  );
}

function EntryScore({ kind, score }: { kind: ListeningKind; score: number }) {
  // Track ratings are out of 10, so they show as a tier word like on the album page
  if (kind === "tracks") {
    const tier = scoreTier(score * 10);
    return <TierWordChip tier={tier}>{tier}</TierWordChip>;
  }
  return <ScoreChip score={score} />;
}

function EntryImage({ kind, imageURLs }: { kind: ListeningKind; imageURLs: string[] }) {
  if (kind === "genres") {
    return (
      <span className={styles.grid} aria-hidden="true">
        {[0, 1, 2, 3].map(place => (imageURLs[place] ? <img key={place} src={imageURLs[place]} alt="" loading="lazy" /> : <span key={place} />))}
      </span>
    );
  }
  const className = kind === "artists" ? styles.photo : styles.cover;
  return imageURLs[0] ? <img className={className} src={imageURLs[0]} alt="" width={48} height={48} loading="lazy" /> : <span className={className} aria-hidden="true" />;
}
