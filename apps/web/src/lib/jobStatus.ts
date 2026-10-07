import { timeAgo } from "@shared/helpers/formatDate";
import type { InferResponseType } from "hono/client";
import type { client } from "@/lib/client";

/** How an artist job's latest run went, as the api saves it */
export type ArtistJobResult = NonNullable<InferResponseType<(typeof client.api.settings)["job-results"]["$get"]>["images"]>;

/** Says when a task last ran, such as "Last run 2 days ago". */
export function describeLastRun(lastRun: string | null, isRunning: boolean): string {
  if (isRunning) return "Running now";
  return lastRun ? `Last run ${timeAgo(lastRun)}` : "Never run";
}

/** The counts of a job run, such as "4 updated, 130 unchanged, 2 failed". The failed count only shows when there is one. */
export function formatJobCounts(updated: number, unchanged: number, failed: number): string {
  const parts = [`${updated} updated`, `${unchanged} unchanged`];
  if (failed > 0) parts.push(`${failed} failed`);
  return parts.join(", ");
}

/** One line on how a job's latest run went, such as "Scheduled run: 4 updated, 130 unchanged". */
export function describeJobResult(result: ArtistJobResult): string {
  const source = result.source === "scheduled" ? "Scheduled run" : "Manual run";
  if (result.stoppedEarly) return `${source} stopped early ${timeAgo(result.finishedAt)}`;
  return `${source}: ${formatJobCounts(result.updated, result.unchanged, result.failed)}`;
}
