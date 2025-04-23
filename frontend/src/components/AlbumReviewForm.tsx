import { DisplayTrack, ExtractedColor, ReviewedAlbum, ReviewedTrack, SpotifyAlbum } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, UseFormRegisterReturn, UseFormRegister, UseFieldArrayRemove, UseFieldArrayAppend, useWatch, UseFormSetValue } from "react-hook-form";
import TrackList from "./TrackList";
import { BestWorstSong } from "./ReviewDetails";
import Button from "./Button";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import RatingChip from "./RatingChip";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
};

// If it's a SpotifyAlbum, the tracks are included
// If it's a ReviewedAlbum, the tracks need to be passed in
interface AlbumReviewFormProps {
  /*** The album to review */
  album: SpotifyAlbum | ReviewedAlbum;
  /** Optional ReviewedTracks */
  tracks?: ReviewedTrack[];
  /** Array of existing genre objects */
  genres: string[];
  /** Selected colors setter to pass the data back up the tree */
  setSelectedColors: React.Dispatch<React.SetStateAction<ExtractedColor[]>>;
  /** Selected colors */
  selectedColors: ExtractedColor[];
}

// Type guard to check if the album is a ReviewedAlbum
const isReviewedAlbum = (album: SpotifyAlbum | ReviewedAlbum): album is ReviewedAlbum => {
  return (album as ReviewedAlbum).reviewScore !== undefined;
};

const AlbumReviewForm = ({ album, tracks, genres, setSelectedColors, selectedColors }: AlbumReviewFormProps) => {
  const isEditing = isReviewedAlbum(album);
  const [dynamicScore, setDynamicScore] = useState<number>(0);

  let displayTracks: DisplayTrack[] = [];
  if (isEditing) {
    displayTracks = tracks!.map((track) => ({
      rating: track.rating,
      name: track.name,
      artistName: track.artistName,
      duration: track.duration,
      // If track.features is empty, it'll be [], therefore trying to JSON.parse it will result in an error
      // So check if it's an array first and parse it if it's not
      features: Array.isArray(track.features) ? track.features : JSON.parse(track.features),
      spotifyID: track.spotifyID,
      artistSpotifyID: track.artistSpotifyID,
    })) as DisplayTrack[];
  } else {
    displayTracks = album.tracks.items.map((track) => ({
      name: track.name,
      artistName: track.artists[0].name,
      duration: track.duration_ms,
      features: track.artists.slice(1).map((artist) => ({ name: artist.name })),
      spotifyID: track.id,
      artistSpotifyID: track.artists[0].id,
      rating: 0,
    })) as DisplayTrack[];
  }

  useEffect(() => {
    setSelectedColors(album.colors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album]);

  // Initialize the form
  const { control, register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      tracks: displayTracks,
      bestSong: isEditing ? album.bestSong : "",
      worstSong: isEditing ? album.worstSong : "",
      reviewContent: isEditing ? album.reviewContent || "" : "",
      colors: selectedColors,
      genres: isEditing ? album.genres.map((genre) => ({ name: genre })) : [],
    },
  });

  // Watch the tracks field to calculate the dynamic score to update the RatingChip
  const watchedTracks = useWatch({ control, name: "tracks" });

  useEffect(() => {
    if (!watchedTracks || watchedTracks.length === 0) return;
    const score = calculateAlbumScore(watchedTracks);
    setDynamicScore(score);
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

  // Adds a new color input, max 5
  const addColor = () => {
    if (selectedColors.length < 5) {
      const updatedColors = [...selectedColors, { hex: "#ffffff" }];
      setSelectedColors(updatedColors);
    }
  };

  // Remove a color at a specific index
  const removeColor = (index: number) => {
    const updatedColors = selectedColors.filter((_, i) => i !== index);
    setSelectedColors(updatedColors);
  };

  // Updates the selectedColors array with the new color
  const handleColorChange = (index: number, newColor: string) => {
    const updatedColors = [...selectedColors];
    updatedColors[index] = { hex: newColor };
    setSelectedColors(updatedColors);
  };

  const {
    mutate: submitReviewMutation,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: ({ formData, album }: { formData: CreateReviewFormData; album: SpotifyAlbum | ReviewedAlbum }) => submitReview(formData, album),
    onSuccess: (data) => {
      console.log("Review submitted successfully:", data);
    },
    onError: (err) => {
      console.error("Error submitting review:", err);
    },
  });

  const onSubmit = (formData: CreateReviewFormData) => {
    submitReviewMutation({ formData, album });
  };

  return (
    <>
      <div className="sticky top-0 z-50">
        {isEditing ? (
          <div className="flex items-center justify-center w-[90%] md:w-[80ch] mx-auto bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 backdrop-blur-sm">
            <RatingChip rating={album.reviewScore} options={{ textBelow: true }} />
            {dynamicScore !== null && <RatingChip rating={dynamicScore} options={{ textBelow: true }} />}
          </div>
        ) : (
          <div className="flex items-center justify-center w-[90%] md:w-[80ch] mx-auto my-8 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 backdrop-blur-sm">
            <RatingChip rating={dynamicScore} options={{ textBelow: true }} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 items-center justify-evenly w-[90%] md:w-[80ch] mx-auto my-8">
        {/* Color Selection */}
        <div className="w-full mb-6 p-4 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40">
          <label className="block text-zinc-200 font-medium mb-3">
            Album Colors <span className="text-neutral-500">(max 5)</span>
          </label>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {selectedColors.map((color, index) => (
              <div className="relative group z-10" key={index}>
                <div className={"w-12 h-12 rounded-full border-2 border-neutral-700 overflow-hidden shadow-lg transition-transform hover:scale-105"} style={{ backgroundColor: color.hex }}>
                  <input type="color" value={color.hex} onChange={(e) => handleColorChange(index, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="absolute -top-2 -right-2 bg-neutral-800 text-red-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            {selectedColors.length < 5 && (
              <button type="button" onClick={addColor} className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:border-neutral-400 transition-colors">
                +
              </button>
            )}
          </div>
        </div>

        {/* Genres Input Field */}
        <GenreSelector genreFields={genreFields} register={register} removeGenre={removeGenre} addGenre={addGenre} setValue={setValue} genres={genres} />

        <BestWorstSong
          bestInput={<input type="text" {...register("bestSong")} className="w-full p-2 rounded" placeholder="Best song..." />}
          worstInput={<input type="text" {...register("worstSong")} className="w-full p-2 rounded" placeholder="Worst song..." />}
        />
        <ReviewContentInput registration={register("reviewContent")} value={getValues("reviewContent")} />

        <TrackList tracks={displayTracks} formMethods={{ control, register, setValue }} />

        <Button type="submit" label={"Submit"} states={{ loading: isPending, error: isError, success: isSuccess }} />
      </form>
    </>
  );
};

export default AlbumReviewForm;

const submitReview = async (formData: CreateReviewFormData, album: SpotifyAlbum | ReviewedAlbum) => {
  // Convert all ratings to numbers to avoid type mismatch issues
  const formattedTracks = formData.tracks.map((track) => ({
    ...track,
    // Convert possible string to number, default to 0
    rating: Number(track.rating) || 0,
  }));

  // The form data expects an array of genre objects, but the structure
  // of the DB is an array of strings. So format the genres.
  const formattedGenres = formData.genres.map((genre) => genre.name);

  // Determine endpoint based on whether it's a new or existing review
  const isEditing = isReviewedAlbum(album);
  const endpoint = isEditing ? `${API_BASE_URL}/api/albums/${album.spotifyID}/edit` : `${API_BASE_URL}/api/albums/create`;

  // Submit the form
  try {
    const response = await fetch(endpoint, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        album: album,
        reviewContent: formData.reviewContent,
        bestSong: formData.bestSong,
        worstSong: formData.worstSong,
        ratedTracks: formattedTracks,
        colors: formData.colors,
        genres: formattedGenres,
      }),
    });

    if (!response.ok) {
      console.error("Failed to submit review:", response.statusText);
    }

    const data = await response.json();
    if (data.success) {
      console.log("Review submitted successfully:", data);
    }
  } catch (e) {
    console.error("Failed to submit review:", e);
  }
};

// # ------------------------- #
// #
// # Custom form components
// #
// # ------------------------- #

interface ReviewContentInputProps {
  registration: UseFormRegisterReturn;
  value?: string;
}

export const ReviewContentInput = ({ registration, value = "" }: ReviewContentInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      const resize = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      resize();

      textarea.addEventListener("input", resize);
      return () => textarea.removeEventListener("input", resize);
    }
  }, [value]);

  return (
    <div className="w-full my-6 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
      <div className="relative px-5 py-4 border-l-4 border-neutral-800">
        <blockquote className="text-zinc-200 text-sm sm:text-base font-light">
          <textarea
            {...registration}
            ref={(e) => {
              ref.current = e;
              if (e) registration.ref(e);
            }}
            defaultValue={value}
            className="w-full bg-transparent resize-none leading-relaxed text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-opacity-50 rounded-lg"
            rows={1}
            placeholder="Write your review here..."
          />
        </blockquote>
      </div>
    </div>
  );
};

interface GenreSelectorProps {
  genreFields: Array<{ id: string; name: string }>;
  register: UseFormRegister<CreateReviewFormData>;
  removeGenre: UseFieldArrayRemove;
  addGenre: UseFieldArrayAppend<CreateReviewFormData, "genres">;
  setValue: UseFormSetValue<CreateReviewFormData>;
  genres: string[];
}

/**
 * This component allows users to select and add genres with a searchable dropdown.
 * It supports dynamic field array operations using react-hook-form.
 */
const GenreSelector = ({ genreFields, register, removeGenre, addGenre, setValue, genres }: GenreSelectorProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter genres based on search term
  const filteredGenres = genres.filter((genre) => genre.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle selecting a genre from dropdown
  const handleSelectGenre = (genre: string) => {
    const lastIndex = genreFields.length - 1;

    if (genreFields[lastIndex]?.name === "") {
      setValue(`genres.${lastIndex}.name`, genre); // ✅ sets value in the input
    } else {
      addGenre({ name: genre });
    }

    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  // Open dropdown and add empty input for genre
  const handleAddGenreClick = () => {
    setSearchTerm("");
    addGenre({ name: "" });
    setIsDropdownOpen(true);
  };

  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40">
      <label className="block text-zinc-200 font-medium mb-3">Genres</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {genreFields.map((field, index) => {
          const isLast = index === genreFields.length - 1;

          return (
            <div key={field.id} className="relative group bg-neutral-700/50 rounded-full pl-3 pr-8 py-1.5 text-sm" ref={isLast ? dropdownRef : undefined}>
              <input
                {...register(`genres.${index}.name`)}
                defaultValue={field.name}
                className="bg-transparent text-zinc-200 focus:outline-none w-full"
                placeholder="Enter genre"
                onChange={(e) => {
                  if (isLast) {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setValue(`genres.${index}.name`, e.target.value); // ✅ immediately update form
                  }
                }}
                onFocus={() => {
                  if (isLast) {
                    setIsDropdownOpen(true);
                  }
                }}
              />

              <button type="button" onClick={() => removeGenre(index)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>

              {/* Dropdown for the last input field */}
              {isLast && (
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50 overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {filteredGenres.length > 0 ? (
                          filteredGenres.map((genre) => (
                            <div key={genre} className="px-3 py-2 hover:bg-neutral-700 cursor-pointer text-zinc-200 text-sm transition-colors" onClick={() => handleSelectGenre(genre)}>
                              {genre}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-neutral-400 text-sm italic">No matching genres.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}

        <button type="button" onClick={handleAddGenreClick} className="bg-neutral-700/30 hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 rounded-full px-3 py-1.5 text-sm flex items-center transition-colors">
          <span className="mr-1">+</span> Add Genre
        </button>
      </div>
    </div>
  );
};
