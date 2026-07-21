import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/main";
import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Camera, ImageIcon, RefreshCw, ArrowRightLeft } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useJobProgress } from "@/hooks/useJobProgress";
import SettingsCard from "@/components/settings/SettingsCard";
import { timeAgo } from "@shared/helpers/formatDate";
import { api } from "@/lib/api";
import { useCallback } from "react";

async function fetchLastRunDetails(): Promise<Record<string, Date | null>> {
  return api.get("/api/settings/last-runs");
}

const settingsQueryOptions = () =>
  queryOptions({
    queryKey: ["settingsLastRuns"],
    queryFn: () => fetchLastRunDetails(),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/settings/")({
  loader: async () => {
    return queryClient.ensureQueryData(settingsQueryOptions());
  },
  component: RouteComponent,
});

type RecalcResult = {
  updatedCount: number;
  totalProcessed: number;
  changedArtists: {
    spotifyID: string;
    name: string;
    changes: {
      field: "totalScore" | "peakScore" | "latestScore" | "averageScore" | "bonusPoints" | "reviewCount" | "unrated" | "leaderboardPosition" | "peakLeaderboardPosition" | "latestLeaderboardPosition";
      before: number | null;
      after: number | null;
    }[];
  }[];
};

function RouteComponent() {
  const socket = useSocket();
  const { data: lastRuns } = useSuspenseQuery(settingsQueryOptions());

  const imageTrigger = useCallback(async () => {
    await api.post("/api/artists/profileImage?all=true");
  }, []);
  const headerTrigger = useCallback(async () => {
    await api.post("/api/artists/headerImage?all=true");
  }, []);

  const images = useJobProgress({ socket, job: "images", triggerFn: imageTrigger });
  const headers = useJobProgress({ socket, job: "headers", triggerFn: headerTrigger });

  const recalcScoresMut = useMutation<RecalcResult, Error, void>({
    mutationFn: async () => {
      return api.post<RecalcResult>("/api/settings/recalculate-scores");
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const labelMap: Record<RecalcResult["changedArtists"][number]["changes"][number]["field"], string> = {
    totalScore: "Overall",
    peakScore: "Peak",
    latestScore: "Latest",
    averageScore: "Average",
    bonusPoints: "Bonus",
    reviewCount: "Reviews",
    unrated: "Unrated",
    leaderboardPosition: "Rank",
    peakLeaderboardPosition: "Peak Rank",
    latestLeaderboardPosition: "Latest Rank",
  };

  const formatVal = (val: number | null, field: RecalcResult["changedArtists"][number]["changes"][number]["field"]) => {
    if (val === null || val === undefined) return "\u2014";
    if (field === "unrated") return val ? "Yes" : "No";
    if (field === "leaderboardPosition" || field === "peakLeaderboardPosition" || field === "latestLeaderboardPosition" || field === "reviewCount") {
      return val;
    }
    return Number(val).toFixed(2);
  };

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">Settings</h1>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
          {/* Update Artist Images */}
          <SettingsCard
            title="Update Artist Images"
            description="Refresh each artist's Spotify profile picture."
            buttonText="Update Images"
            icon={<Camera className="w-6 h-6" />}
            accentBar="bg-fuchsia-600"
            accentBgLight="bg-fuchsia-500/20"
            accentText="text-fuchsia-500"
            accentFill="bg-fuchsia-500"
            lastRun={lastRuns["artist_images_last_run"] ? timeAgo(lastRuns["artist_images_last_run"]) : "Never"}
            job={images.state}
            onTrigger={images.trigger}
            onDismiss={images.dismiss}
          />

          {/* Update Header Images */}
          <SettingsCard
            title="Update Header Images"
            description="Re-scrape each artist's Spotify header image."
            buttonText="Manage Headers"
            icon={<ImageIcon className="w-6 h-6" />}
            accentBar="bg-violet-600"
            accentBgLight="bg-violet-500/20"
            accentText="text-violet-500"
            accentFill="bg-violet-500"
            lastRun={lastRuns["artist_headers_last_run"] ? timeAgo(lastRuns["artist_headers_last_run"]) : "Never"}
            job={headers.state}
            onTrigger={headers.trigger}
            onDismiss={headers.dismiss}
          />

          {/* Recalculate Scores */}
          <SettingsCard
            title="Recalculate Artist Scores"
            description="Recompute artist scores and leaderboard positions."
            buttonText="Recalculate Scores"
            icon={<RefreshCw className="w-6 h-6" />}
            accentBar="bg-cyan-600"
            accentBgLight="bg-cyan-500/20"
            accentText="text-cyan-500"
            accentFill="bg-cyan-500"
            lastRun={lastRuns["artist_scores_last_run"] ? timeAgo(lastRuns["artist_scores_last_run"]) : "Never"}
            onTrigger={() => recalcScoresMut.mutate()}
            isPending={recalcScoresMut.isPending}
          >
            {/* Recalc specific results */}
            {recalcScoresMut.isSuccess && recalcScoresMut.data && (
              <div className="text-xs text-neutral-400">
                Updated {recalcScoresMut.data.updatedCount} of {recalcScoresMut.data.totalProcessed} artists.
              </div>
            )}
            {recalcScoresMut.isSuccess && recalcScoresMut.data && recalcScoresMut.data.changedArtists.length > 0 && (
              <div className="p-3 border border-neutral-800 rounded-lg bg-neutral-900/60 max-h-48 overflow-auto">
                <div className="flex items-center gap-2 text-sm text-neutral-200 mb-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Updated artists</span>
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  {recalcScoresMut.data.changedArtists.slice(0, 8).map(artist => (
                    <div key={artist.spotifyID} className="border border-neutral-800 rounded-md p-2">
                      <div className="font-medium text-neutral-100 mb-1">{artist.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {artist.changes.map(change => (
                          <div key={change.field}>
                            <span className="text-neutral-500">{labelMap[change.field]}:</span> {formatVal(change.before, change.field)} → {formatVal(change.after, change.field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {recalcScoresMut.data.changedArtists.length > 8 && <div className="text-neutral-500">+ {recalcScoresMut.data.changedArtists.length - 8} more...</div>}
                </div>
              </div>
            )}
            {recalcScoresMut.isError && <div className="text-xs text-red-400">{recalcScoresMut.error?.message ?? "Failed to recalculate scores."}</div>}
          </SettingsCard>
        </motion.div>
      </div>
    </RequireAdmin>
  );
}
