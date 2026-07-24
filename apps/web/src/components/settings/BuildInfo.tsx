import { useQuery } from "@tanstack/react-query";
import { GitCommitHorizontal, TriangleAlert } from "lucide-react";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";

async function fetchBuildInfo() {
  return handle(client.api.settings["build-info"].$get());
}

const formatBuiltAt = (builtAt: string) => new Date(builtAt).toLocaleString();

/**
 * Shows what is actually deployed, the api and web commits side by side, when
 * the images were built, and the versions running right now.
 */
export const BuildInfo = () => {
  const { data, isError } = useQuery({
    queryKey: queryKeys.settings.buildInfo,
    queryFn: fetchBuildInfo,
    staleTime: Infinity,
  });

  const webSha = __GIT_SHA__;
  const mismatch = data && data.api.sha !== "dev" && webSha !== "dev" && data.api.sha !== webSha;

  const versions: [string, string | null][] = data
    ? [
        ["node", data.versions.node],
        ["postgres", data.versions.postgres],
        ["hono", data.versions.packages.hono],
        ["drizzle", data.versions.packages["drizzle-orm"]],
        ["pg", data.versions.packages.pg],
        ["zod", data.versions.packages.zod],
        ["react", __REACT_VERSION__],
        ["vite", __VITE_VERSION__],
      ]
    : [];

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60" data-testid="build-info-card">
      <div className="h-1 bg-emerald-600" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-emerald-500/20 text-emerald-500">
            <GitCommitHorizontal className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-medium text-neutral-100">Build Info</h2>
        </div>

        {isError && <p className="text-xs text-red-400">Couldn't load build info.</p>}

        {data && (
          <>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">api</span>
                <span className="font-mono text-neutral-200">{data.api.sha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">web</span>
                <span className="font-mono text-neutral-200">{webSha}</span>
              </div>
              {mismatch && (
                <div className="flex items-center gap-2 text-xs text-amber-400 mt-1" data-testid="build-info-mismatch">
                  <TriangleAlert className="w-4 h-4" />
                  <span>api and web are on different commits</span>
                </div>
              )}
            </div>

            {(data.api.message || data.api.builtAt) && (
              <div className="text-xs text-neutral-400">
                {data.api.message && <p className="text-neutral-300 mb-1">"{data.api.message}"</p>}
                {data.api.builtAt && <p>Built {formatBuiltAt(data.api.builtAt)}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {versions.map(([name, version]) => (
                <div key={name} className="flex justify-between gap-2">
                  <span className="text-neutral-500">{name}</span>
                  <span className="font-mono text-neutral-300 truncate">{version ?? "?"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
