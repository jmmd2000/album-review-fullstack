import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { SettingsRow } from "@/components/settings/SettingsRow";
import styles from "./RefreshScheduleRow.module.css";

const INTERVAL_OPTIONS = [
  { days: 0, label: "Off" },
  { days: 3, label: "Every 3 days" },
  { days: 7, label: "Every week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Every month" },
];

const refreshIntervalQueryOptions = queryOptions({
  queryKey: queryKeys.settings.refreshInterval,
  queryFn: () => handle(client.api.settings["refresh-interval"].$get()),
});

/** The settings row that picks how often the api refreshes artist photos and headers by itself. */
export function RefreshScheduleRow() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(refreshIntervalQueryOptions);

  const save = useMutation({
    mutationFn: (intervalDays: number) => handle(client.api.settings["refresh-interval"].$put({ json: { intervalDays } })),
    onSuccess: ({ intervalDays }) => {
      queryClient.setQueryData(queryKeys.settings.refreshInterval, { ...data, intervalDays });
      toast.success(intervalDays === 0 ? "Automatic refresh is off" : `Artists now refresh ${labelFor(intervalDays).toLowerCase()}`);
    },
    onError: () => toast.error("The refresh schedule couldn't be saved. Try again."),
  });

  // A value saved some other way still shows, as its own option
  const options = INTERVAL_OPTIONS.some(option => option.days === data.intervalDays) ? INTERVAL_OPTIONS : [...INTERVAL_OPTIONS, { days: data.intervalDays, label: labelFor(data.intervalDays) }];
  const details = data.scheduleEnabled ? [] : ["Automatic refresh is turned off on this server, so nothing runs here."];

  return (
    <SettingsRow
      title="Automatic refresh"
      description="Updates artist photos and then headers at 3am UTC, when they are due."
      details={details}
      action={
        <select className={styles.select} aria-label="How often artists refresh" value={data.intervalDays} disabled={save.isPending} onChange={event => save.mutate(Number(event.target.value))}>
          {options.map(option => (
            <option key={option.days} value={option.days}>
              {option.label}
            </option>
          ))}
        </select>
      }
    />
  );
}

function labelFor(days: number) {
  return INTERVAL_OPTIONS.find(option => option.days === days)?.label ?? `Every ${days} days`;
}
