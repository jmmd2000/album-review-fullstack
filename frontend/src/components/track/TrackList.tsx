import { DisplayTrack } from "@shared/types";
import TrackCard from "./TrackCard";
import { Controller, UseFormReturn } from "react-hook-form";
import { CreateReviewFormData } from "@components/form/AlbumReviewForm";
import { useState } from "react";
import { getRatingStyles } from "@/helpers/getRatingStyles";

/**
 * The props for the TrackList component.
 */
interface TrackListProps {
  /** The tracks to display */
  tracks: DisplayTrack[];
  /** Optional react-hook-form methods (only provided when used inside a form) */
  formMethods?: Pick<UseFormReturn<CreateReviewFormData>, "control" | "setValue" | "register">;
  /** Optional fixed height for scrollable list */
  maxHeight?: string;
  /** Optional flag to sort tracks by rating */
  sortByRating?: boolean;
}

/**
 * This component creates a list of TrackCards.
 */
const TrackList = ({ tracks, formMethods, maxHeight = "500px", sortByRating = false }: TrackListProps) => {
  // Local state to force re-renders when ratings change
  const [updatedTracks, setUpdatedTracks] = useState(tracks);

  // Function to handle rating changes
  const handleRatingChange = (index: number, newRating: number) => {
    const newTracks = updatedTracks.map((track, i) => (i === index ? { ...track, rating: newRating } : track));

    // update local state to force re-render so the colour changes
    setUpdatedTracks(newTracks);

    if (formMethods) {
      formMethods.setValue(`tracks.${index}.rating`, newRating);
    }
  };

  // Sort tracks by rating if sortByRating is true
  const sortedTracks = sortByRating
    ? [...updatedTracks].sort((a, b) => {
        // Sort by rating in descending order
        // Handle undefined ratings (put them at the end)
        if (a.rating === undefined) return 1;
        if (b.rating === undefined) return -1;
        return b.rating - a.rating;
      })
    : updatedTracks;

  // Group tracks by rating tier if sortByRating is true
  const groupedTracks = sortByRating
    ? sortedTracks.reduce(
        (acc, track) => {
          const rating = track.rating !== undefined ? track.rating * 10 : 0;
          const { label } = getRatingStyles(rating);

          if (!acc[label]) {
            acc[label] = [];
          }

          acc[label].push(track);
          return acc;
        },
        {} as Record<string, DisplayTrack[]>
      )
    : null;

  // Get all rating tiers in order of highest to lowest
  const ratingOrder = ["Perfect", "Amazing", "Brilliant", "Great", "Good", "Meh", "OK", "Bad", "Awful", "Terrible", "Unrated"];

  return (
    <div
      className="flex flex-col gap-2 mb-8 items-center mx-auto w-full @container/TrackList"
      style={{
        maxHeight: sortByRating ? maxHeight : "auto",
        overflowY: sortByRating ? "auto" : "visible",
        padding: sortByRating ? "0.5rem" : "0",
        maxWidth: "90%", // Ensure the container doesn't take full width
      }}
    >
      {sortByRating && groupedTracks
        ? // Render tracks grouped by rating tier
          ratingOrder.map((tierLabel) => {
            const tierTracks = groupedTracks[tierLabel];
            if (!tierTracks || tierTracks.length === 0) return null;
            const { backgroundColorLighter } = getRatingStyles(tierLabel);

            return (
              <div key={tierLabel} className="w-full max-w-[80ch] mx-auto">
                <h3 className={`text-lg font-medium mb-2 sticky top-0 ${backgroundColorLighter} backdrop-blur-xl border border-neutral-800/30 rounded-md p-2 z-10`}>
                  {tierLabel} <span className="text-neutral-400">({tierTracks.length})</span>
                </h3>
                <div className="flex flex-col gap-2 mb-4">{tierTracks.map((track) => renderTrackCard(track, tierTracks.indexOf(track), formMethods, handleRatingChange))}</div>
              </div>
            );
          })
        : // Render tracks in original order
          sortedTracks.map((track, index) => renderTrackCard(track, index, formMethods, handleRatingChange))}
    </div>
  );

  // Helper function to render a track card
  function renderTrackCard(track: DisplayTrack, index: number, formMethods?: TrackListProps["formMethods"], handleRatingChange?: (index: number, rating: number) => void) {
    return formMethods ? (
      <TrackCard key={track.spotifyID} track={track} trackNumber={sortByRating ? undefined : index + 1}>
        {/* Hidden input for track ID */}
        <input type="hidden" {...formMethods.register(`tracks.${index}.spotifyID`)} value={track.spotifyID} />

        {/* Rating dropdown */}
        <Controller
          control={formMethods.control}
          name={`tracks.${index}.rating`}
          render={({ field }) => (
            <select
              {...field}
              className="uppercase"
              onChange={(e) => {
                const newRating = Number(e.target.value);
                field.onChange(newRating);
                handleRatingChange?.(index, newRating);
              }}
            >
              {[...Array(11)].map((_, idx) => {
                const { label, textColor } = getRatingStyles(idx * 10);
                return (
                  <option key={idx} value={idx} className={`text-center uppercase font-bold ${textColor}`}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}
        />
      </TrackCard>
    ) : (
      <TrackCard key={track.spotifyID} track={track} trackNumber={sortByRating ? undefined : index + 1} />
    );
  }
};

export default TrackList;
