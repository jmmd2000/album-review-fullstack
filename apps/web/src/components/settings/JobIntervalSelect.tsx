import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import styles from "./JobIntervalSelect.module.css";

import type { InferResponseType } from "hono/client";

/** Every scheduled job's interval in days, keyed by job name, and whether this server runs the schedule */
export type JobIntervals = InferResponseType<(typeof client.api.settings)["job-intervals"]["$get"]>;

const INTERVAL_OPTIONS = [
  { days: 0, label: "Not scheduled" },
  { days: 3, label: "Every 3 days" },
  { days: 7, label: "Every week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Every month" },
];

interface JobIntervalSelectProps {
  job: string;
  /** The job's name as people see it, such as "Artist photos" */
  title: string;
  intervalDays: number;
}

/** Picks how often a scheduled job runs by itself, and saves the choice straight away. */
export function JobIntervalSelect({ job, title, intervalDays }: JobIntervalSelectProps) {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (days: number) => handle(client.api.settings["job-intervals"][":name"].$put({ param: { name: job }, json: { intervalDays: days } })),
    onSuccess: ({ intervalDays: savedDays }) => {
      queryClient.setQueryData<JobIntervals>(queryKeys.settings.jobIntervals, current => (current ? { ...current, intervals: { ...current.intervals, [job]: savedDays } } : current));
      toast.success(savedDays === 0 ? `${title} no longer run on a schedule` : `${title} now run ${labelFor(savedDays).toLowerCase()}`);
    },
    onError: () => toast.error("The schedule couldn't be saved. Try again."),
  });

  // A value saved some other way still shows, as its own option
  const options = INTERVAL_OPTIONS.some(option => option.days === intervalDays) ? INTERVAL_OPTIONS : [...INTERVAL_OPTIONS, { days: intervalDays, label: labelFor(intervalDays) }];

  return (
    <select className={styles.select} aria-label={`How often ${title.toLowerCase()} run`} value={intervalDays} disabled={save.isPending} onChange={event => save.mutate(Number(event.target.value))}>
      {options.map(option => (
        <option key={option.days} value={option.days}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function labelFor(days: number) {
  return INTERVAL_OPTIONS.find(option => option.days === days)?.label ?? `Every ${days} days`;
}
