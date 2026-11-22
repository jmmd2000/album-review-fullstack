import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { summariseArtistJob, useArtistJob } from "@/hooks/useArtistJob";
import { describeJobResult, describeLastRun } from "@/lib/jobStatus";
import { Button } from "@/components/ui/Button";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { JobIntervalSelect } from "@/components/settings/JobIntervalSelect";
import { ResultDetails } from "@/components/settings/ResultDetails";
import styles from "./ArtistJobRow.module.css";

import type { Progress } from "@shared/types";
import type { ArtistJob, ArtistJobState } from "@/hooks/useArtistJob";
import type { ArtistJobResult } from "@/lib/jobStatus";

/** The image each changed artist shows in a job's results, or null to show the name only */
const IMAGE_KINDS: Record<ArtistJob, "photo" | "header" | "thumbnail" | null> = {
  "artist-images": "photo",
  "artist-headers": "header",
  "listener-links": null,
  "album-suggestions": null,
  "played-tracks": "thumbnail",
  "played-genres": null,
};

/** The label of a finished job's list of results */
const RESULT_LABELS: Record<ArtistJob, string> = {
  "artist-images": "Show the updated and failed artists",
  "artist-headers": "Show the updated and failed artists",
  "listener-links": "Show the updated and failed artists",
  "album-suggestions": "Show the updated and failed artists",
  "played-tracks": "Show the tracks and artists looked up",
  "played-genres": "Show the artists given genres",
};

/** The jobs whose results are reviewed artists, so each name links to the artist's page */
const LINKS_TO_ARTISTS: Record<ArtistJob, boolean> = {
  "artist-images": true,
  "artist-headers": true,
  "listener-links": true,
  "album-suggestions": true,
  "played-tracks": false,
  "played-genres": false,
};

interface ArtistJobRowProps {
  job: ArtistJob;
  title: string;
  description: string;
  actionLabel: string;
  lastRun: string | null;
  /** How the latest run went, or null if the api has no record of one */
  result: ArtistJobResult | null;
  /** Days between scheduled runs. 0 means the job only runs by hand. */
  intervalDays: number;
  /** False when this server never runs jobs on a schedule */
  scheduleEnabled: boolean;
}

/** A settings row for a job that goes through every artist, with its schedule, live progress and then the results. */
export function ArtistJobRow({ job, title, description, actionLabel, lastRun, result, intervalDays, scheduleEnabled }: ArtistJobRowProps) {
  const { state, start } = useArtistJob(job);
  const isRunning = state.status === "running";
  const details = [describeLastRun(lastRun, isRunning)];
  if (result && !isRunning) details.push(describeJobResult(result));
  if (!scheduleEnabled) details.push("Scheduled runs are turned off on this server.");

  return (
    <SettingsRow
      title={title}
      description={description}
      details={details}
      action={
        <div className={styles.actions}>
          <JobIntervalSelect job={job} title={title} intervalDays={intervalDays} />
          <Button onClick={() => void start()} disabled={isRunning}>
            {isRunning ? "Running…" : actionLabel}
          </Button>
        </div>
      }
    >
      {state.status === "running" && <JobProgress current={state.current} />}
      {state.status === "finished" && <JobResults state={state} imageKind={IMAGE_KINDS[job]} label={RESULT_LABELS[job]} linksToArtists={LINKS_TO_ARTISTS[job]} />}
    </SettingsRow>
  );
}

function JobProgress({ current }: { current: Progress | null }) {
  const fraction = current && current.total > 0 ? current.index / current.total : 0;

  return (
    <div className={styles.progress}>
      <div className={styles.track} role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={current?.total ?? 0} aria-valuenow={current?.index ?? 0}>
        <div className={styles.fill} style={{ transform: `scaleX(${fraction})` }} />
      </div>
      <div className={styles.current}>
        {current ? (
          <>
            <ArtistPhoto url={current.artistImage} />
            <span className={styles.currentName}>{current.artistName}</span>
            <span className={styles.count}>
              {current.index} of {current.total}
            </span>
          </>
        ) : (
          <span className={styles.currentName}>Starting…</span>
        )}
      </div>
    </div>
  );
}

interface JobResultsProps {
  state: ArtistJobState;
  imageKind: "photo" | "header" | "thumbnail" | null;
  label: string;
  linksToArtists: boolean;
}

function JobResults({ state, imageKind, label, linksToArtists }: JobResultsProps) {
  const { changed, failed, unchangedCount, error } = state;
  const processedCount = changed.length + failed.length + unchangedCount;

  return (
    <div className={styles.results}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {processedCount > 0 && <p>{summariseArtistJob(state)}</p>}
      {(changed.length > 0 || failed.length > 0) && (
        <ResultDetails label={label}>
          <div className={styles.scroll}>
            {changed.length > 0 && (
              <ul className={styles.changes}>
                {changed.map(entry => (
                  <li key={entry.spotifyID} className={styles.change}>
                    {imageKind === "photo" && (
                      <>
                        <ArtistPhoto url={entry.artistImage} />
                        <ArrowRightIcon className={styles.arrow} weight="bold" aria-hidden="true" />
                        <ArtistPhoto url={entry.newArtistImage} />
                      </>
                    )}
                    {imageKind === "thumbnail" && <ArtistPhoto url={entry.artistImage} />}
                    {imageKind === "header" && (
                      <>
                        <HeaderThumbnail url={entry.headerImage} />
                        <ArrowRightIcon className={styles.arrow} weight="bold" aria-hidden="true" />
                        <HeaderThumbnail url={entry.newHeaderImage} />
                      </>
                    )}
                    <EntryName entry={entry} linksToArtist={linksToArtists} />
                  </li>
                ))}
              </ul>
            )}
            {failed.length > 0 && (
              <div className={styles.failed}>
                <h4 className={styles.failedTitle}>Failed</h4>
                <ul className={styles.failedList}>
                  {failed.map(entry => (
                    <li key={entry.spotifyID}>
                      <EntryName entry={entry} linksToArtist={linksToArtists} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ResultDetails>
      )}
    </div>
  );
}

function EntryName({ entry, linksToArtist }: { entry: Progress; linksToArtist: boolean }) {
  if (!linksToArtist) return <span>{entry.artistName}</span>;
  return (
    <Link to="/artists/$artistID" params={{ artistID: entry.spotifyID }} className={styles.artistLink}>
      {entry.artistName}
    </Link>
  );
}

function ArtistPhoto({ url }: { url?: string }) {
  if (!url) return <span className={styles.photo} />;
  return <img className={styles.photo} src={url} alt="" />;
}

function HeaderThumbnail({ url }: { url?: string }) {
  if (!url) return <span className={styles.header} />;
  return <img className={styles.header} src={url} alt="" />;
}
