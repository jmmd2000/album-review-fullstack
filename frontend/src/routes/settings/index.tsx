// frontend/src/routes/SettingsPage.tsx
import { RequireAdmin } from "@/components/RequireAdmin";
import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/Button";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { spring } from "framer-motion";
import { Camera, ImageIcon, ChevronRight } from "lucide-react";
import { getRatingStyles } from "@/helpers/getRatingStyles";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const profileImageMut = useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/artists/profileImage?all=true`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }
    },
  });

  const headerImageMut = useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/artists/headerImage?all=true`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }
    },
  });

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

  const settingsCards = [
    {
      id: "artist-images",
      title: "Update Artist Images",
      buttonText: "Update Images",
      description: "Refresh each artist's Spotify profile picture.",
      lastUpdated: "3 days ago",
      icon: <Camera className="w-6 h-6" />,
      ratingLabel: "Perfect",
      onClick: () => profileImageMut.mutate(),
      states: {
        loading: profileImageMut.isPending,
        success: profileImageMut.isSuccess,
        error: profileImageMut.isError,
      },
      stateMessages: {
        loading: "Updating artist images…",
        success: `Done! Images updated`,
        error:
          profileImageMut.error?.message ?? "Failed to update artist images.",
      },
    },
    {
      id: "header-images",
      title: "Update Header Images",
      buttonText: "Manage Headers",
      description: "Re-scrape each artist's Spotify header image.",
      lastUpdated: "1 week ago",
      icon: <ImageIcon className="w-6 h-6" />,
      ratingLabel: "Amazing",
      onClick: () => headerImageMut.mutate(),
      states: {
        loading: headerImageMut.isPending,
        success: headerImageMut.isSuccess,
        error: headerImageMut.isError,
      },
      stateMessages: {
        loading: "Updating header images…",
        success: `Done! Headers updated`,
        error:
          headerImageMut.error?.message ?? "Failed to update header images.",
      },
    },
  ];

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {settingsCards.map(card => {
              const style = getRatingStyles(card.ratingLabel);
              return (
                <motion.div
                  key={card.id}
                  className="relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-800 flex flex-col"
                  variants={itemVariants}
                  whileHover="hover"
                >
                  <div className={`h-1 w-full ${style.backgroundColor}`} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${style.backgroundColorLighter} ${style.textColor}`}
                      >
                        {card.icon}
                      </div>
                    </div>
                    <h2 className="text-lg font-medium mb-2">{card.title}</h2>
                    <p className="text-sm text-neutral-400 flex-1">
                      {card.description}
                      <span className="block mt-2 text-xs text-neutral-500">
                        Last updated: {card.lastUpdated}
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
      </div>
    </RequireAdmin>
  );
}
