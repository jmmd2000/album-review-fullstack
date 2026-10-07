import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { summariseArtistJob, useArtistJob } from "@/hooks/useArtistJob";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ResultDetails } from "@/components/settings/ResultDetails";
import styles from "./ArtistJobRow.module.css";

import type { Progress } from "@shared/types";
import type { ArtistJob, ArtistJobState } from "@/hooks/useArtistJob";

interface ArtistJobRowProps {
  job: ArtistJob;
  title: string;
  description: string;
  actionLabel: string;
  lastRun: string | null;
}

/** A settings row for a job that goes through every artist, with live progress and then the results. */
export function ArtistJobRow({ job, title, description, actionLabel, lastRun }: ArtistJobRowProps) {
  const { state, start } = useArtistJob(job);

  return (
    <SettingsRow title={title} description={description} lastRun={lastRun} actionLabel={actionLabel} onAction={start} isRunning={state.status === "running"}>
      {state.status === "running" && <JobProgress current={state.current} />}
      {state.status === "finished" && <JobResults state={state} imageKind={job === "artist-images" ? "photo" : "header"} />}
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
  imageKind: "photo" | "header";
}

function JobResults({ state, imageKind }: JobResultsProps) {
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
        <ResultDetails label="Show the updated and failed artists">
          {changed.length > 0 && (
            <ul className={styles.changes}>
              {changed.map(entry => (
                <li key={entry.spotifyID} className={styles.change}>
                  {imageKind === "photo" ? (
                    <>
                      <ArtistPhoto url={entry.artistImage} />
                      <ArrowRightIcon className={styles.arrow} weight="bold" aria-hidden="true" />
                      <ArtistPhoto url={entry.newArtistImage} />
                    </>
                  ) : (
                    <>
                      <HeaderThumbnail url={entry.headerImage} />
                      <ArrowRightIcon className={styles.arrow} weight="bold" aria-hidden="true" />
                      <HeaderThumbnail url={entry.newHeaderImage} />
                    </>
                  )}
                  <ArtistLink entry={entry} />
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
                    <ArtistLink entry={entry} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ResultDetails>
      )}
    </div>
  );
}

function ArtistLink({ entry }: { entry: Progress }) {
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
