import { DisplayTrack, ExtractedColor, Genre, ReviewBonuses, ReviewedAlbum, ReviewedTrack, SpotifyAlbum } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch, UseFormRegisterReturn, UseFormRegister, UseFieldArrayRemove, UseFieldArrayAppend, UseFormSetValue } from "react-hook-form";
import TrackList from "./TrackList";
import { BestWorstSong } from "./ReviewDetails";
import Button from "./Button";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import RatingChip from "./RatingChip";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { queryClient } from "@/main";
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

const AlbumReviewForm = ({ album, tracks, genres, setSelectedColors, selectedColors }: AlbumReviewFormProps) => {
  const isEditing = isReviewedAlbum(album);

  // Dynamic score state
  const [dynamicScores, setDynamicScores] = useState<{ baseScore: number; bonuses: ReviewBonuses; finalScore: number }>({
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
    displayTracks = tracks!.map((t) => ({
      rating: t.rating,
      name: t.name,
      artistName: t.artistName,
      duration: t.duration,
      features: Array.isArray(t.features) ? t.features : JSON.parse(t.features),
      spotifyID: t.spotifyID,
      artistSpotifyID: t.artistSpotifyID,
    }));
  } else {
    displayTracks = album.tracks.items.map((t) => ({
      name: t.name,
      artistName: t.artists[0].name,
      duration: t.duration_ms,
      features: t.artists.slice(1).map((a) => ({ id: a.id, name: a.name })),
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
  const { control, register, handleSubmit, setValue, getValues } = useForm<CreateReviewFormData>({
    defaultValues: {
      tracks: displayTracks,
      bestSong: isEditing ? album.bestSong : "",
      worstSong: isEditing ? album.worstSong : "",
      reviewContent: isEditing ? album.reviewContent || "" : "",
      colors: selectedColors,
      genres: isEditing ? album.genres.map((g) => ({ name: g })) : [],
      affectsArtistScore: isEditing ? album.affectsArtistScore : true,
    },
  });

  // Watch tracks to update dynamic scoring
  const watchedTracks = useWatch({ control, name: "tracks" });
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

  // Mutation for submitting review
  const {
    mutate: submitReviewMutation,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: ({ formData, album }: { formData: CreateReviewFormData; album: SpotifyAlbum | ReviewedAlbum }) => submitReview(formData, album),
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
            <RatingChip rating={album.finalScore} options={{ textBelow: true, hideUnratedDialog: true }} scoreBreakdown={{ baseScore: album.reviewScore, bonuses: album.reviewBonuses, affectsArtistScore: album.affectsArtistScore }} />
            {dynamicScores.finalScore !== null && (
              <RatingChip rating={dynamicScores.finalScore} options={{ textBelow: true, hideUnratedDialog: true }} scoreBreakdown={{ baseScore: dynamicScores.baseScore, bonuses: dynamicScores.bonuses, affectsArtistScore: album.affectsArtistScore }} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-[90%] md:w-[80ch] mx-auto my-8 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 backdrop-blur-sm">
            <RatingChip rating={dynamicScores.finalScore} options={{ textBelow: true, hideUnratedDialog: true }} scoreBreakdown={{ baseScore: dynamicScores.baseScore, bonuses: dynamicScores.bonuses, affectsArtistScore: false }} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 items-center justify-evenly w-[90%] md:w-[80ch] mx-auto my-8">
        {/* AAS toggle */}
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
          bestInput={<input type="text" {...register("bestSong")} className="w-full p-2 rounded" placeholder="Best song..." autoComplete="off" />}
          worstInput={<input type="text" {...register("worstSong")} className="w-full p-2 rounded" placeholder="Worst song..." autoComplete="off" />}
        />
        <ReviewContentInput registration={register("reviewContent")} value={getValues("reviewContent")} />

        <TrackList tracks={displayTracks} formMethods={{ control, register, setValue }} />

        <Button
          type="submit"
          label={"Submit"}
          states={{ loading: isPending, error: isError, success: isSuccess }}
          stateMessages={{ loading: "Submitting review...", success: "Review submitted successfully!", error: "Error submitting review, please try again." }}
        />
      </form>
    </>
  );
};

export default AlbumReviewForm;

// Helper to send data to API
const submitReview = async (formData: CreateReviewFormData, album: SpotifyAlbum | ReviewedAlbum) => {
  const formattedTracks = formData.tracks.map((t) => ({ ...t, rating: Number(t.rating) || 0 }));
  const formattedGenres = formData.genres.map((g) => g.name);
  const isEditing = isReviewedAlbum(album);
  const endpoint = isEditing ? `${API_BASE_URL}/api/albums/${album.spotifyID}/edit` : `${API_BASE_URL}/api/albums/create`;
  try {
    const resp = await fetch(endpoint, {
      method: isEditing ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        album,
        reviewContent: formData.reviewContent,
        bestSong: formData.bestSong,
        worstSong: formData.worstSong,
        ratedTracks: formattedTracks,
        colors: formData.colors,
        genres: formattedGenres,
        affectsArtistScore: formData.affectsArtistScore,
      }),
    });
    if (!resp.ok) console.error("Failed to submit review:", resp.statusText);
  } catch (e) {
    console.error("Failed to submit review:", e);
  }
};

// Textarea with formatting options
interface ReviewContentInputProps {
  registration: UseFormRegisterReturn;
  value?: string;
}
export const ReviewContentInput = ({ registration, value = "" }: ReviewContentInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, [value]);

  const applyFormatting = (format: string) => {
    if (!ref.current) return;
    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      alert("Please select some text first");
      return;
    }
    let prefix = "";
    let suffix = "";
    switch (format) {
      case "bold":
        prefix = "**";
        suffix = "**";
        break;
      case "italic":
        prefix = "*";
        suffix = "*";
        break;
      case "underline":
        prefix = "__";
        suffix = "__";
        break;
      case "color":
        prefix = "{color:#fb2c36}";
        suffix = "{color}";
        break;
    }
    const current = textarea.value;
    const selected = current.substring(start, end);
    const updated = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
    textarea.value = updated;
    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setTimeout(() => {
      textarea.focus();
      const pos = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="w-full my-6">
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => applyFormatting("bold")} className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => applyFormatting("italic")} className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white" title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => applyFormatting("underline")} className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white" title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => applyFormatting("color")} className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white" title="Red Text">
          <span className="text-[#fb2c36]">A</span>
        </button>
      </div>
      <div className="rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
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
              rows={3}
              placeholder="Write your review here..."
            />
          </blockquote>
        </div>
      </div>
    </div>
  );
};

// Genre selector with searchable dropdown
interface GenreSelectorProps {
  genreFields: Array<{ id: string; name: string }>;
  register: UseFormRegister<CreateReviewFormData>;
  removeGenre: UseFieldArrayRemove;
  addGenre: UseFieldArrayAppend<CreateReviewFormData, "genres">;
  setValue: UseFormSetValue<CreateReviewFormData>;
  genres: Genre[];
}
const GenreSelector = ({ genreFields, register, removeGenre, addGenre, setValue, genres }: GenreSelectorProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filtered = genres.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const handleSelect = (genre: string) => {
    const lastIdx = genreFields.length - 1;
    if (genreFields[lastIdx]?.name === "") {
      setValue(`genres.${lastIdx}.name`, genre);
    } else {
      addGenre({ name: genre });
    }
    setIsDropdownOpen(false);
    setSearchTerm("");
  };
  const handleAdd = () => {
    setSearchTerm("");
    addGenre({ name: "" });
    setIsDropdownOpen(true);
  };
  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-neutral-800">
      <label className="block text-zinc-200 font-medium mb-3">Genres</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {genreFields.map((field, idx) => {
          const isLast = idx === genreFields.length - 1;
          return (
            <div key={field.id} className="relative group bg-neutral-700/50 rounded-full pl-3 pr-8 py-1.5 text-sm" ref={isLast ? dropdownRef : undefined}>
              <input
                {...register(`genres.${idx}.name`)}
                defaultValue={field.name}
                className="bg-transparent text-zinc-200 focus:outline-none w-full"
                placeholder="Enter genre"
                autoComplete="off"
                onChange={(e) => {
                  if (isLast) {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setValue(`genres.${idx}.name`, e.target.value);
                  }
                }}
                onFocus={() => {
                  if (isLast) setIsDropdownOpen(true);
                }}
              />
              <button type="button" onClick={() => removeGenre(idx)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
              {isLast && (
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {filtered.length > 0 ? (
                          filtered.map((g) => (
                            <div key={g.slug} className="px-3 py-2 hover:bg-neutral-700 cursor-pointer text-zinc-200 text-sm" onClick={() => handleSelect(g.name)}>
                              {g.name}
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
        <button type="button" onClick={handleAdd} className="bg-neutral-700/30 hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 rounded-full px-3 py-1.5 text-sm flex items-center">
          <span className="mr-1">+</span> Add Genre
        </button>
      </div>
    </div>
  );
};
