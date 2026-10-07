import { useQuery } from "@tanstack/react-query";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import styles from "./BuildInfo.module.css";

function formatBuiltAt(builtAt: string) {
  return new Date(builtAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** The site version, the api and web commits that are deployed, when they were built, and the versions running now. */
export function BuildInfo() {
  const { data, isError } = useQuery({
    queryKey: queryKeys.settings.buildInfo,
    queryFn: () => handle(client.api.settings["build-info"].$get()),
    staleTime: Infinity,
  });

  if (isError) return <p className={styles.error}>The build info couldn't load.</p>;
  if (!data) return null;

  const webSha = __GIT_SHA__;
  const shasDiffer = data.api.sha !== "dev" && webSha !== "dev" && data.api.sha !== webSha;
  const versions: [string, string | null][] = [
    ["Node", data.versions.node],
    ["Postgres", data.versions.postgres],
    ["Hono", data.versions.packages.hono],
    ["Drizzle", data.versions.packages["drizzle-orm"]],
    ["pg", data.versions.packages.pg],
    ["Zod", data.versions.packages.zod],
    ["React", __REACT_VERSION__],
    ["Vite", __VITE_VERSION__],
  ];

  return (
    <div className={styles.build}>
      <dl className={styles.facts}>
        <dt>Version</dt>
        <dd>{__SITE_VERSION__}</dd>
        <dt>API commit</dt>
        <dd className={styles.sha}>{data.api.sha}</dd>
        <dt>Web commit</dt>
        <dd className={styles.sha}>{webSha}</dd>
        {data.api.message && (
          <>
            <dt>Message</dt>
            <dd>{data.api.message}</dd>
          </>
        )}
        {data.api.builtAt && (
          <>
            <dt>API built</dt>
            <dd>{formatBuiltAt(data.api.builtAt)}</dd>
          </>
        )}
        {__BUILT_AT__ && (
          <>
            <dt>Web built</dt>
            <dd>{formatBuiltAt(__BUILT_AT__)}</dd>
          </>
        )}
      </dl>
      {shasDiffer && (
        <p className={styles.warning} role="status">
          <WarningCircleIcon weight="bold" aria-hidden="true" /> The api and the web app are on different commits.
        </p>
      )}
      <dl className={styles.versions}>
        {versions.map(([name, version]) => (
          <div key={name} className={styles.version}>
            <dt>{name}</dt>
            <dd>{version ?? "unknown"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
