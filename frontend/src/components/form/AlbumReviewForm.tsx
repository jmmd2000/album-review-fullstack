import {
  DisplayTrack,
  ExtractedColor,
  Genre,
  ReviewBonuses,
  ReviewedAlbum,
  ReviewedTrack,
  SpotifyAlbum,
} from "@shared/types";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import TrackList from "@components/track/TrackList";
import { BestWorstSong } from "@components/album/ReviewDetails";
import Button from "@components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import RatingChip from "@components/ui/RatingChip";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { queryClient } from "@/main";
import { api } from "@/lib/api";
import { ColourPicker } from "@components/form/ColourPicker";
import ArtistSelector from "@components/form/ArtistSelector";
import { ReviewContentInput } from "@components/form/ReviewContentInput";
import GenreSelector from "@components/form/GenreSelector";

//# --------------------------------------------------------------------------------------------- #
//# This form is used for both creating a new review and editing an existing review
//# The type guard determines if the album is a SpotifyAlbum or a ReviewedAlbum
//# The only 'wonky' thing that maybe could be handled better is the color selection
//# Because the colours can be updated, the BlurryHeader needs to be updated as well
//# So the selectedColors state lies in the parent component (create.tsx or edit.tsx)
//# And is passed down to the form, where it's updated and passed back up
//# --------------------------------------------------------------------------------------------- #

/**
 * Represents the data submitted when creating a new review
 */
export type CreateReviewFormData = {
  /*** An array of track IDs and their ratings*/
  tracks: DisplayTrack[];
  /*** Selected album artists */
  selectedArtistIDs: string[];
  /*** Selected album artists that affect score */
  scoreArtistIDs: string[];
  /*** The best song on the album */
  bestSong: string;
  /*** The worst song on the album */
  worstSong: string;
  /*** The review content */
  reviewContent: string;
  /*** The selected colors */
  colors: ExtractedColor[];
  /*** String array of genre strings */
  genres: { name: string }[];
  /*** Whether or not the review affects the artists score */
  affectsArtistScore: boolean;
};

// If it's a SpotifyAlbum, the tracks are included
// If it's a ReviewedAlbum, the tracks need to be passed in
interface AlbumReviewFormProps {
  /*** The album to review */
  album: SpotifyAlbum | ReviewedAlbum;
  /** Optional ReviewedTracks */
  tracks?: ReviewedTrack[];
  /** Array of existing genre objects */
  genres: Genre[];
  /** Selected colors setter to pass the data back up the tree */
  setSelectedColors: React.Dispatch<React.SetStateAction<ExtractedColor[]>>;
  /** Selected colors */
  selectedColors: ExtractedColor[];
}

// Type guard for ReviewedAlbum
const isReviewedAlbum = (album: SpotifyAlbum | ReviewedAlbum): album is ReviewedAlbum => {
  return (album as ReviewedAlbum).reviewScore !== undefined;
};

const AlbumReviewForm = ({
  album,
  tracks,
  genres,
  setSelectedColors,
  selectedColors,
}: AlbumReviewFormProps) => {
  const isEditing = isReviewedAlbum(album);
  const albumArtists =
    "albumArtists" in album &&
    Array.isArray(album.albumArtists) &&
    album.albumArtists.length > 0
      ? album.albumArtists
      : !isEditing
        ? album.artists.map(artist => ({
            spotifyID: artist.id,
            name: artist.name,
            imageURLs: [],
          }))
        : [];

  // Dynamic score state
  const [dynamicScores, setDynamicScores] = useState<{
    baseScore: number;
    bonuses: ReviewBonuses;
    finalScore: number;
  }>({
    baseScore: 0,
    bonuses: {
      qualityBonus: 0,
      perfectBonus: 0,
      consistencyBonus: 0,
      noWeakBonus: 0,
      terriblePenalty: 0,
      poorQualityPenalty: 0,
      noStrongPenalty: 0,
      totalBonus: 0,
    },
    finalScore: 0,
  });

  // Prepare track list for form
  let displayTracks: DisplayTrack[] = [];
  if (isEditing) {
    displayTracks = tracks!.map(t => ({
      rating: t.rating,
      name: t.name,
      artistName: t.artistName,
      duration: t.duration,
      features: Array.isArray(t.features) ? t.features : JSON.parse(t.features),
      spotifyID: t.spotifyID,
      artistSpotifyID: t.artistSpotifyID,
    }));
  } else {
    displayTracks = album.tracks.items.map(t => ({
      name: t.name,
      artistName: t.artists[0].name,
      duration: t.duration_ms,
      features: t.artists.slice(1).map(a => ({ id: a.id, name: a.name })),
      spotifyID: t.id,
      artistSpotifyID: t.artists[0].id,
      rating: 0,
    }));
  }

  // Sync selected colors from parent
  useEffect(() => {
    setSelectedColors(album.colors);
  }, [album, setSelectedColors]);

  // Initialize form with defaults
  const { control, register, handleSubmit, setValue, getValues } =
    useForm<CreateReviewFormData>({
      defaultValues: {
        tracks: displayTracks,
        selectedArtistIDs: isEditing
          ? album.artistSpotifyIDs && album.artistSpotifyIDs.length > 0
            ? album.artistSpotifyIDs
            : albumArtists.map(artist => artist.spotifyID)
          : albumArtists.map(artist => artist.spotifyID),
        scoreArtistIDs: isEditing
          ? (album.artistScoreIDs ?? [])
          : albumArtists.map(artist => artist.spotifyID),
        bestSong: isEditing ? album.bestSong : "",
        worstSong: isEditing ? album.worstSong : "",
        reviewContent: isEditing ? album.reviewContent || "" : "",
        colors: selectedColors,
        genres: isEditing ? album.genres.map(g => ({ name: g })) : [],
        affectsArtistScore: isEditing ? album.affectsArtistScore : true,
      },
    });

  useEffect(() => {
    register("selectedArtistIDs");
    register("scoreArtistIDs");
  }, [register]);

  // Watch tracks to update dynamic scoring
  const watchedTracks = useWatch({ control, name: "tracks" });
  const watchedArtists = useWatch({ control, name: "selectedArtistIDs" });
  const watchedScoreArtists = useWatch({ control, name: "scoreArtistIDs" });
  useEffect(() => {
    if (!watchedTracks?.length) return;
    const { baseScore, bonuses, finalScore } = calculateAlbumScore(watchedTracks);
    setDynamicScores({ baseScore, bonuses, finalScore });
  }, [watchedTracks]);

  const {
    fields: genreFields,
    append: addGenre,
    remove: removeGenre,
  } = useFieldArray({
    control,
    name: "genres",
  });

  // Sync selectedColors with the form state
  useEffect(() => {
    setValue("colors", selectedColors);
  }, [selectedColors, setValue]);

  // Mutation for submitting review
  const {
    mutate: submitReviewMutation,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: ({
      formData,
      album,
    }: {
      formData: CreateReviewFormData;
      album: SpotifyAlbum | ReviewedAlbum;
    }) => submitReview(formData, album),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });

  const onSubmit = (formData: CreateReviewFormData) => {
    submitReviewMutation({ formData, album });
  };

  return (
    <>
      <div className="sticky top-0 z-50">
        {isEditing ? (
          <div className="flex items-center justify-center w-[90%] md:w-[80ch] mx-auto bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 backdrop-blur-sm">
            <RatingChip
              rating={album.finalScore}
              options={{ textBelow: true, hideUnratedDialog: true }}
              scoreBreakdown={{
                baseScore: album.reviewScore,
                bonuses: album.reviewBonuses,
                affectsArtistScore: album.affectsArtistScore,
              }}
            />
            {dynamicScores.finalScore !== null && (
              <RatingChip
                rating={dynamicScores.finalScore}
                options={{ textBelow: true, hideUnratedDialog: true }}
                scoreBreakdown={{
                  baseScore: dynamicScores.baseScore,
                  bonuses: dynamicScores.bonuses,
                  affectsArtistScore: album.affectsArtistScore,
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-[90%] md:w-[80ch] mx-auto my-8 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 backdrop-blur-sm">
            <RatingChip
              rating={dynamicScores.finalScore}
              options={{ textBelow: true, hideUnratedDialog: true }}
              scoreBreakdown={{
                baseScore: dynamicScores.baseScore,
                bonuses: dynamicScores.bonuses,
                affectsArtistScore: false,
              }}
            />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8 items-center justify-evenly w-[90%] md:w-[80ch] mx-auto my-8"
        data-testid="album-review-form"
      >
        {/* AAS toggle for solo albums */}
        {albumArtists.length <= 1 && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="aasToggle"
              {...register("affectsArtistScore")}
              className="w-4 h-4 appearance-none bg-zinc-800 border-2 border-zinc-600 rounded cursor-pointer
               checked:bg-green-500 checked:border-green-700
               focus:ring-green-400 focus:ring-2"
            />

            <label htmlFor="aasToggle" className="text-zinc-200 cursor-pointer">
              Include in artist score
            </label>
          </div>
        )}

        <ArtistSelector
          albumArtists={albumArtists}
          watchedArtists={watchedArtists}
          watchedScoreArtists={watchedScoreArtists}
          setValue={setValue}
        />

        <ColourPicker selectedColors={selectedColors} setSelectedColors={setSelectedColors} />

        {/* Genres Input Field */}
        <GenreSelector
          genreFields={genreFields}
          register={register}
          removeGenre={removeGenre}
          addGenre={addGenre}
          setValue={setValue}
          genres={genres}
        />

        <BestWorstSong
          bestInput={
            <input
              type="text"
              {...register("bestSong")}
              className="w-full p-2 rounded"
              placeholder="Best song..."
              autoComplete="off"
            />
          }
          worstInput={
            <input
              type="text"
              {...register("worstSong")}
              className="w-full p-2 rounded"
              placeholder="Worst song..."
              autoComplete="off"
            />
          }
        />
        <ReviewContentInput
          registration={register("reviewContent")}
          value={getValues("reviewContent")}
        />

        <TrackList tracks={displayTracks} formMethods={{ control, register, setValue }} />

        <Button
          type="submit"
          label={"Submit"}
          states={{ loading: isPending, error: isError, success: isSuccess }}
          stateMessages={{
            loading: "Submitting review...",
            success: "Review submitted successfully!",
            error: "Error submitting review, please try again.",
          }}
        />
      </form>
    </>
  );
};

export default AlbumReviewForm;

// Helper to send data to API
const submitReview = async (
  formData: CreateReviewFormData,
  album: SpotifyAlbum | ReviewedAlbum
) => {
  const formattedTracks = formData.tracks.map(t => ({ ...t, rating: Number(t.rating) || 0 }));
  const formattedGenres = formData.genres.map(g => g.name);
  const isEditing = isReviewedAlbum(album);
  const path = isEditing ? `/api/albums/${album.spotifyID}/edit` : `/api/albums/create`;
  const method = isEditing ? api.put : api.post;
  await method(path, {
    album,
    reviewContent: formData.reviewContent,
    bestSong: formData.bestSong,
    worstSong: formData.worstSong,
    ratedTracks: formattedTracks,
    colors: formData.colors,
    genres: formattedGenres,
    affectsArtistScore: formData.affectsArtistScore,
    selectedArtistIDs: formData.selectedArtistIDs,
    scoreArtistIDs: formData.scoreArtistIDs,
  });
};
