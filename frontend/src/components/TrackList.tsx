import { DisplayTrack } from "@shared/types";
import TrackCard from "@components/TrackCard";
import { Controller, UseFormReturn } from "react-hook-form";
import { CreateReviewFormData } from "./AlbumReviewForm";
import { convertRatingToColor } from "@/helpers/convertRatingToColor";
import { convertRatingToString } from "@/helpers/convertRatingToString";
import { useState } from "react";

/**
 * The props for the TrackList component.
 */
interface TrackListProps {
  /** The tracks to display */
  tracks: DisplayTrack[];
  /** Optional react-hook-form methods (only provided when used inside a form) */
  formMethods?: Pick<UseFormReturn<CreateReviewFormData>, "control" | "setValue" | "register">;
}

/**
 * This component creates a list of TrackCards.
 */
const TrackList = ({ tracks, formMethods }: TrackListProps) => {
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

  return (
    <div className="flex flex-col gap-4 mb-8 items-center @container/TrackList">
      {updatedTracks.map((track, index) =>
        formMethods ? (
          <TrackCard key={track.spotifyID} track={track}>
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
                    handleRatingChange(index, newRating);
                  }}
                >
                  {[...Array(11)].map((_, idx) => (
                    <option key={idx} value={idx} className={`text-center uppercase font-bold ${convertRatingToColor(idx, { text: true })}`}>
                      {convertRatingToString(idx)}
                    </option>
                  ))}
                </select>
              )}
            />
          </TrackCard>
        ) : (
          <TrackCard key={track.spotifyID} track={track} />
        )
      )}
    </div>
  );
};

export default TrackList;
