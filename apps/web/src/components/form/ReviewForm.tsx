import { useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { coverColourStyle } from "@/lib/coverColours";
import { morphProps } from "@/lib/coverMorph";
import { tierColourVar } from "@/lib/tierColours";
import { formatBonus } from "@/lib/reviewForm";
import { toast } from "@/lib/toast";
import { AlbumBackdrop } from "@/components/album/AlbumBackdrop";
import { AlbumArtistsField } from "@/components/form/AlbumArtistsField";
import { BonusSlider } from "@/components/form/BonusSlider";
import { ColourSwatches } from "@/components/form/ColourSwatches";
import { GenreChips } from "@/components/form/GenreChips";
import { ReviewTextInput } from "@/components/form/ReviewTextInput";
import { TrackRater } from "@/components/form/TrackRater";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import coverColours from "@/styles/coverColours.module.css";
import styles from "./ReviewForm.module.css";

import type { FormEvent } from "react";
import type { AlbumArtist, DisplayTrack, SpotifyImage } from "@shared/types";
import type { ReviewFormValues } from "@/lib/reviewForm";

interface ReviewFormProps {
  /** The album's Spotify ID, so its cover can transition in from the album page and back */
  albumID: string;
  albumName: string;
  artistName: string;
  /** The official 640px cover */
  cover: SpotifyImage | undefined;
  /** Every artist on the album. With more than one, the form asks which are credited. */
  albumArtists: AlbumArtist[];
  initialValues: ReviewFormValues;
  /** Every genre name, suggested while typing a genre */
  genreSuggestions: string[];
  /** Saves the review. The form shows a toast while it runs. */
  onSave: (values: ReviewFormValues) => Promise<unknown>;
  onCancel: () => void;
}

/**
 * The review form for a new or an existing review: the cover and the live score in a sticky column,
 * then the track ratings, the review text, the cover colours, the genres and the artist options.
 * The page glows in the cover colours as they change.
 */
export function ReviewForm({ albumID, albumName, artistName, cover, albumArtists, initialValues, genreSuggestions, onSave, onCancel }: ReviewFormProps) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);

  const update = (changes: Partial<ReviewFormValues>) => setValues(current => ({ ...current, ...changes }));

  const changeTrack = (index: number, changes: Partial<DisplayTrack>) => update({ tracks: values.tracks.map((track, position) => (position === index ? { ...track, ...changes } : track)) });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await toast.promise(onSave(values), { loading: "Saving the review…", success: "Review saved", error: "The review couldn't be saved. Try again." });
    } catch {
      setSaving(false);
    }
  };

  const ratedCount = values.tracks.filter(track => (track.rating ?? 0) > 0).length;
  const runtimeMinutes = Math.round(values.tracks.reduce((total, track) => total + track.duration, 0) / 60000);

  return (
    <div className={`${coverColours.coverColours} ${styles.page}`} style={coverColourStyle(values.colours)}>
      <AlbumBackdrop until={headRef} />
      <form className={styles.split} onSubmit={handleSubmit}>
        <div className={styles.aside}>
          {cover && <img className={styles.cover} src={cover.url} alt={`${albumName} cover`} width={cover.width} height={cover.height} {...morphProps("album", albumID)} />}
          <LiveScore tracks={values.tracks} bonus={values.bonus} ratedCount={ratedCount} />
        </div>

        <div ref={headRef} className={styles.head}>
          <button type="button" className={styles.back} onClick={onCancel}>
            <ArrowLeftIcon weight="bold" aria-hidden="true" /> Cancel
          </button>
          <h1 className={styles.title}>{albumName}</h1>
          <p className={styles.byline}>
            {artistName}
            <span>
              {values.tracks.length} {values.tracks.length === 1 ? "track" : "tracks"}, {runtimeMinutes} min
            </span>
          </p>
        </div>

        <div className={styles.body}>
          <TrackRater tracks={values.tracks} onRate={(index, rating) => changeTrack(index, { rating })} onPick={(index, pick) => changeTrack(index, { pick })} />

          <div className={styles.field}>
            <BonusSlider value={values.bonus} onChange={bonus => update({ bonus })} />
          </div>

          <ReviewTextInput value={values.reviewContent} onChange={reviewContent => update({ reviewContent })} />

          <div className={styles.field}>
            <span className={styles.label}>Cover colours</span>
            <ColourSwatches colours={values.colours} onChange={colours => update({ colours })} />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Genres</span>
            <GenreChips genres={values.genres} suggestions={genreSuggestions} onChange={genres => update({ genres })} />
          </div>

          {albumArtists.length > 1 ? (
            <div className={styles.field}>
              <span className={styles.label}>Album artists</span>
              <AlbumArtistsField
                artists={albumArtists}
                creditedIDs={values.creditedArtistIDs}
                scoreIDs={values.scoreArtistIDs}
                onChange={(creditedArtistIDs, scoreArtistIDs) => update({ creditedArtistIDs, scoreArtistIDs })}
              />
            </div>
          ) : (
            <div className={styles.field}>
              <Checkbox label="Counts towards the artist's score" checked={values.affectsArtistScore} onChange={affectsArtistScore => update({ affectsArtistScore })} />
            </div>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save review"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface LiveScoreProps {
  tracks: DisplayTrack[];
  bonus: number;
  ratedCount: number;
}

/** The score the ratings and the bonus add up to so far, with its tier and a line on how it's made. */
function LiveScore({ tracks, bonus, ratedCount }: LiveScoreProps) {
  const { baseScore, finalScore } = calculateAlbumScore(tracks, bonus);
  const tier = ratedCount > 0 ? scoreTier(finalScore) : "Unrated";

  return (
    <div className={styles.live} style={{ color: tierColourVar(tier) }} aria-live="polite">
      <span className={styles.number}>{ratedCount > 0 ? Math.ceil(finalScore) : "-"}</span>
      <div>
        <div className={styles.word}>{tier}</div>
        <div className={styles.sum}>
          {ratedCount} of {tracks.length} rated. {baseScore} from the tracks, {bonus === 0 ? "no bonus" : `${formatBonus(bonus)} bonus`}.
        </div>
      </div>
    </div>
  );
}
