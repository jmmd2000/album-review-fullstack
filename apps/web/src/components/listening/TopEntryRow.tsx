import { scoreTier } from "@shared/helpers/ratingTiers";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { TierWordChip } from "@/components/ui/TierWordChip";
import { describeEntry, type ListeningKind, type RankBy, type TopEntry } from "@/lib/listening";
import type { morphProps } from "@/lib/coverMorph";
import styles from "./TopEntryRow.module.css";

interface TopEntryRowProps {
  kind: ListeningKind;
  by: RankBy;
  entry: TopEntry;
  selected: boolean;
  onSelect: () => void;
}

/** The change in rank as a small arrow and number, "New", or a dash for no change. */
export function RankChange({ change }: { change: TopEntry["change"] }) {
  if (change === null) return null;
  if (change === "new") return <span className={styles.new}>New</span>;
  if (change === 0) return <span className={styles.same}>–</span>;
  if (change > 0) return <span className={styles.up}>▲ {change}</span>;
  return <span className={styles.down}>▼ {-change}</span>;
}

/** One ranked artist, track, album or genre: its rank and change, image, name, plays or minutes, and score. Selecting it shows the entry. */
export function TopEntryRow({ kind, by, entry, selected, onSelect }: TopEntryRowProps) {
  const value = by === "plays" ? entry.plays : entry.minutes;
  const unit = by === "plays" ? (value === 1 ? "play" : "plays") : "min";
  return (
    <li>
      <button type="button" className={styles.row} aria-pressed={selected} onClick={onSelect}>
        <span className={styles.rank}>
          {entry.rank}
          <RankChange change={entry.change} />
        </span>
        <EntryImage kind={kind} imageURLs={entry.imageURLs} />
        <span className={styles.text}>
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.detail}>{describeEntry(kind, entry)}</span>
        </span>
        <span className={styles.plays}>
          <b>{value.toLocaleString("en-GB")}</b> {unit}
        </span>
        <span className={styles.score}>{entry.score !== null && <EntryScore kind={kind} score={entry.score} />}</span>
      </button>
    </li>
  );
}

export function EntryScore({ kind, score }: { kind: ListeningKind; score: number }) {
  // Track ratings are out of 10, so they show as a tier word like on the album page
  if (kind === "tracks") {
    const tier = scoreTier(score * 10);
    return <TierWordChip tier={tier}>{tier}</TierWordChip>;
  }
  return <ScoreChip score={score} />;
}

interface EntryImageProps {
  kind: ListeningKind;
  imageURLs: string[];
  large?: boolean;
  /** Lets the image fly to or from the artist or album page */
  morph?: ReturnType<typeof morphProps>;
}

/** An entry's photo or cover, or a 2 by 2 grid of a genre's top artists. `large` fills its column. */
export function EntryImage({ kind, imageURLs, large = false, morph }: EntryImageProps) {
  if (kind === "genres") {
    return (
      <span className={`${styles.grid} ${large ? styles.large : ""}`} aria-hidden="true">
        {[0, 1, 2, 3].map(place => (imageURLs[place] ? <img key={place} src={imageURLs[place]} alt="" loading="lazy" /> : <span key={place} />))}
      </span>
    );
  }
  const className = `${kind === "artists" ? styles.photo : styles.cover} ${large ? styles.large : ""}`;
  return imageURLs[0] ? <img className={className} src={imageURLs[0]} alt="" width={48} height={48} loading="lazy" {...morph} /> : <span className={className} aria-hidden="true" />;
}
