import { RequireAdmin } from "@/components/RequireAdmin";
import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/Button";
import { queryClient } from "@/main";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import { spring } from "framer-motion";
import { Camera, ImageIcon, ChevronRight } from "lucide-react";
import { getRatingStyles } from "@/helpers/getRatingStyles";
import { io, Socket } from "socket.io-client";
import { useEffect } from "react";
import SameBanner from "@/components/settings/SameBanner";
import StatusIndicator from "@/components/settings/StatusIndicator";
import { ProgressState, useProgressState } from "@/hooks/useProgressState";
import { timeAgo } from "@shared/helpers/formatDate";

const API_BASE_URL = import.meta.env.VITE_API_URL!;

async function fetchLastRunDetails(): Promise<Record<string, Date | null>> {
  const response = await fetch(`${API_BASE_URL}/api/settings/last-runs`, {
    credentials: "include",
  });
  return await response.json();
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

function RouteComponent() {
  const {
    imageState,
    imageDispatch,
    headerState,
    headerDispatch,
    resetImageState,
    resetHeaderState,
    dismissImageBanner,
    dismissHeaderBanner,
  } = useProgressState();

  const { data: lastRuns } = useSuspenseQuery(settingsQueryOptions());

  useEffect(() => {
    const socket: Socket = io(API_BASE_URL, {
      path: "/ws",
      transports: ["websocket", "polling"],
      withCredentials: true,
      forceNew: true,
      // debug
      autoConnect: true,
      timeout: 20000,
    });

    // socket.on("connect", () => console.log("Socket connected, id:", socket.id));
    // socket.on("disconnect", reason =>
    //   console.log("Socket disconnected:", reason)
    // );

    socket.on("artist:images:progress", data => {
      imageDispatch({ type: "PROGRESS", payload: data });
    });
    socket.on("artist:images:same", data => {
      imageDispatch({ type: "SAME_RESULT", payload: data });
    });
    socket.on("artist:images:changed", data => {
      imageDispatch({ type: "CHANGED_RESULT", payload: data });
    });
    socket.on("artist:images:error", data => {
      imageDispatch({ type: "ERROR_RESULT", payload: data });
    });
    socket.on("artist:images:done", () => {
      imageDispatch({ type: "DONE" });
    });

    socket.on("artist:headers:fetching", data => {
      headerDispatch({ type: "FETCHING_PROGRESS", payload: data });
    });
    socket.on("artist:headers:progress", data => {
      headerDispatch({ type: "PROGRESS", payload: data });
    });
    socket.on("artist:headers:same", data => {
      headerDispatch({ type: "SAME_RESULT", payload: data });
    });
    socket.on("artist:headers:changed", data => {
      headerDispatch({ type: "CHANGED_RESULT", payload: data });
    });
    socket.on("artist:headers:error", data => {
      headerDispatch({ type: "ERROR_RESULT", payload: data });
    });
    socket.on("artist:headers:done", () => {
      headerDispatch({ type: "DONE" });
    });

    return () => {
      socket.disconnect();
    };
  }, [imageDispatch, headerDispatch]);

  // Mutations
  const profileImageMut = useMutation<void, Error, void>({
    mutationFn: async () => {
      resetImageState();
      const res = await fetch(
        `${API_BASE_URL}/api/artists/profileImage?all=true`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
    },
  });

  const headerImageMut = useMutation<void, Error, void>({
    mutationFn: async () => {
      resetHeaderState();
      const res = await fetch(
        `${API_BASE_URL}/api/artists/headerImage?all=true`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
    },
  });

  // Helper function to get current progress for display
  const getCurrentProgress = (state: ProgressState) => {
    return (
      state.currentProgress || state.sameProgress || state.fetchingProgress
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: spring, stiffness: 100, damping: 15 },
    },
    hover: {
      scale: 1.03,
      y: -5,
      boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)",
      transition: { duration: 0.3 },
    },
  };

  // Actual content for the settings page
  // Badly set up for additional settings but works for these two for now
  const settingsCards = [
    {
      id: "artist-images",
      title: "Update Artist Images",
      buttonText: "Update Images",
      icon: <Camera className="w-6 h-6" />,
      ratingLabel: "Perfect",
      onClick: () => profileImageMut.mutate(),
      states: {
        loading: profileImageMut.isPending,
        success:
          profileImageMut.isSuccess &&
          (imageState.isDone || !!imageState.sameProgress),
        error: profileImageMut.isError,
      },
      stateMessages: {
        loading: "Updating artist images…",
        success: imageState.sameProgress
          ? `Image is the same for ${imageState.sameProgress.artistName}`
          : imageState.changedEntries.length > 0 &&
              imageState.sameEntries.length > 0
            ? `Done! ${imageState.changedEntries.length} updated, ${imageState.sameEntries.length} unchanged`
            : imageState.changedEntries.length > 0
              ? `Done! ${imageState.changedEntries.length} images updated`
              : "Done! Images updated",
        error:
          profileImageMut.error?.message ?? "Failed to update artist images.",
      },
      renderDescription: () => {
        if (imageState.currentProgress) {
          return `Processing ${imageState.currentProgress.artistName} (${imageState.currentProgress.index}/${imageState.currentProgress.total})`;
        }
        if (imageState.sameProgress) {
          return `Image is the same for ${imageState.sameProgress.artistName}`;
        }
        return "Refresh each artist's Spotify profile picture.";
      },
      renderLastUpdated: () =>
        imageState.isDone
          ? "Completed"
          : imageState.sameProgress
            ? "No changes"
            : getCurrentProgress(imageState)
              ? "In progress"
              : lastRuns[`artist_images_last_run`]
                ? timeAgo(lastRuns[`artist_images_last_run`])
                : "Never",
      // Pass state data to components
      state: imageState,
      currentProgress: getCurrentProgress(imageState),
    },
    {
      id: "header-images",
      title: "Update Header Images",
      buttonText: "Manage Headers",
      icon: <ImageIcon className="w-6 h-6" />,
      ratingLabel: "Amazing",
      onClick: () => headerImageMut.mutate(),
      states: {
        loading: headerImageMut.isPending,
        success:
          headerImageMut.isSuccess &&
          (headerState.isDone || !!headerState.sameProgress),
        error: headerImageMut.isError,
      },
      stateMessages: {
        loading: "Updating header images…",
        success: headerState.sameProgress
          ? `Header is the same for ${headerState.sameProgress.artistName}`
          : headerState.changedEntries.length > 0 &&
              headerState.sameEntries.length > 0
            ? `Done! ${headerState.changedEntries.length} updated, ${headerState.sameEntries.length} unchanged`
            : headerState.changedEntries.length > 0
              ? `Done! ${headerState.changedEntries.length} headers updated`
              : "Done! Headers updated",
        error:
          headerImageMut.error?.message ?? "Failed to update header images.",
      },
      renderDescription: () => {
        if (headerState.fetchingProgress) {
          return `Fetching header for ${headerState.fetchingProgress.artistName} (${headerState.fetchingProgress.index}/${headerState.fetchingProgress.total})`;
        }
        if (headerState.currentProgress) {
          return `Processing ${headerState.currentProgress.artistName} (${headerState.currentProgress.index}/${headerState.currentProgress.total})`;
        }
        if (headerState.sameProgress) {
          return `Header is the same for ${headerState.sameProgress.artistName}`;
        }
        return "Re-scrape each artist's Spotify header image.";
      },
      renderLastUpdated: () =>
        headerState.isDone
          ? "Completed"
          : headerState.sameProgress
            ? "No changes"
            : getCurrentProgress(headerState)
              ? "In progress"
              : lastRuns[`artist_headers_last_run`]
                ? timeAgo(lastRuns[`artist_headers_last_run`])
                : "Never",
      // Pass state data to components
      state: headerState,
      currentProgress: getCurrentProgress(headerState),
    },
  ];

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">
          Settings
        </h1>

        <SameBanner
          same={imageState.sameProgress}
          currentProgress={imageState.currentProgress}
          fetchingProgress={imageState.fetchingProgress}
          sameEntries={imageState.sameEntries}
          changedEntries={imageState.changedEntries}
          errorEntries={imageState.errorEntries}
          type="image"
          total={imageState.total}
          isDone={imageState.isDone}
          dismissed={imageState.dismissedBanner}
          onDismiss={dismissImageBanner}
        />

        <SameBanner
          same={headerState.sameProgress}
          currentProgress={headerState.currentProgress}
          fetchingProgress={headerState.fetchingProgress}
          sameEntries={headerState.sameEntries}
          changedEntries={headerState.changedEntries}
          errorEntries={headerState.errorEntries}
          type="header"
          total={headerState.total}
          isDone={headerState.isDone}
          dismissed={headerState.dismissedBanner}
          onDismiss={dismissHeaderBanner}
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {settingsCards.map(card => {
            const style = getRatingStyles(card.ratingLabel);
            const progress = card.currentProgress;
            const color =
              card.id === "artist-images" ? "bg-blue-500" : "bg-green-500";

            return (
              <motion.div
                key={card.id}
                className="relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-800 flex flex-col"
                variants={itemVariants}
                whileHover="hover"
              >
                <div className={`h-1 w-full ${style.backgroundColor}`} />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full ${style.backgroundColorLighter} ${style.textColor}`}
                    >
                      {card.icon}
                    </div>
                    <StatusIndicator
                      sameEntries={card.state?.sameEntries || []}
                      changedEntries={card.state?.changedEntries || []}
                      errorEntries={card.state?.errorEntries || []}
                      isDone={card.state?.isDone || false}
                      current={card.currentProgress}
                      total={card.state?.total || null}
                    />
                  </div>
                  <h2 className="text-lg font-medium mb-2">{card.title}</h2>

                  {progress && (
                    <div className="w-full bg-neutral-700 h-2 rounded mb-4">
                      <div
                        className={`${color} h-full rounded transition-all duration-300`}
                        style={{
                          width: `${(progress.index / progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  <p className="text-sm text-neutral-400 flex-1">
                    {card.renderDescription()}
                    <span className="block mt-2 text-xs text-neutral-500">
                      Last updated: {card.renderLastUpdated()}
                    </span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <Button
                      label={
                        <span className="flex items-center gap-1">
                          {card.buttonText}
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      }
                      onClick={card.onClick}
                      states={card.states}
                      stateMessages={card.stateMessages}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </RequireAdmin>
  );
}
