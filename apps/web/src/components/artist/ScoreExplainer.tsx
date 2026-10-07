import { Popover } from "@base-ui/react/popover";
import { InfoIcon } from "@phosphor-icons/react";
import { SINGLE_RELEASE_DISCOUNT } from "@shared/constants";
import styles from "./ScoreExplainer.module.css";

/** A button that opens a short, plain-words note on how artist scores work. It shows no figures from the artist. */
export function ScoreExplainer() {
  return (
    <Popover.Root>
      <Popover.Trigger className={styles.trigger}>
        <InfoIcon weight="bold" aria-hidden="true" /> How scores work
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={styles.positioner} side="bottom" align="start" sideOffset={8}>
          <Popover.Popup className={styles.popup}>
            <Popover.Title className={styles.title}>How scores work</Popover.Title>
            <Popover.Description render={<div className={styles.body} />}>
              <p>
                An artist&apos;s score is the average of their album scores, with the best albums counting the most. Their best album counts in full, the second best a bit less, the third less again,
                and so on. Longer albums count more than short ones.
              </p>
              <p>If an artist has only one album, their score is {Math.round(SINGLE_RELEASE_DISCOUNT * 100)}% of that album&apos;s score.</p>
              <p>
                <strong>Peak</strong> is the score of their best album. <strong>Latest</strong> is the average of their three most recent albums.
              </p>
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
