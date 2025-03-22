import { DisplayTrack, ExtractedColor, ReviewedAlbum, ReviewedTrack, SpotifyAlbum } from "@shared/types";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
// import TrackCard from "@components/TrackCard";
// import { convertRatingToString } from "@/helpers/convertRatingToString";
// import { convertRatingToColor } from "@/helpers/convertRatingToColor";
import TrackList from "./TrackList";
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
  /** Selected colors setter to pass the data back up the tree */
  setSelectedColors: React.Dispatch<React.SetStateAction<ExtractedColor[]>>;
  /** Selected colors */
  selectedColors: ExtractedColor[];
}

// Type guard to check if the album is a ReviewedAlbum
const isReviewedAlbum = (album: SpotifyAlbum | ReviewedAlbum): album is ReviewedAlbum => {
  return (album as ReviewedAlbum).reviewScore !== undefined;
};

const AlbumReviewForm = ({ album, tracks, setSelectedColors, selectedColors }: AlbumReviewFormProps) => {
  let displayTracks: DisplayTrack[] = [];
  if (isReviewedAlbum(album)) {
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
      bestSong: isReviewedAlbum(album) ? album.bestSong : "",
      worstSong: isReviewedAlbum(album) ? album.worstSong : "",
      reviewContent: isReviewedAlbum(album) ? album.reviewContent || "" : "",
      colors: selectedColors,
      genres: isReviewedAlbum(album) ? album.genres.map((genre) => ({ name: genre })) : [],
    },
  });

  // // UseFieldArray for dynamic track ratings
  // const { fields } = useFieldArray({
  //   control,
  //   name: "tracks",
  // });

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
    // setSelectedColors((prevColors) => {
    //   const newColors = [...prevColors];
    //   newColors[index] = { hex: newColor };
    //   return newColors;
    // });
    const updatedColors = [...selectedColors];
    updatedColors[index] = { hex: newColor };
    setSelectedColors(updatedColors);
  };

  // Submit the review
  const onSubmit = async (formData: CreateReviewFormData) => {
    // Get the colors from the form
    const colorsToSubmit = getValues("colors");

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
        method: isReviewedAlbum(album) ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          album: album,
          reviewContent: formData.reviewContent,
          bestSong: formData.bestSong,
          worstSong: formData.worstSong,
          ratedTracks: formattedTracks,
          colors: colorsToSubmit,
          genres: formattedGenres,
        }),
      });

      if (!response.ok) {
        console.error("Failed to submit review:", response.statusText);
      }
    } catch (e) {
      console.error("Failed to submit review:", e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* review content */}
      <div className="mb-4">
        <textarea {...register("reviewContent")} className="w-full p-2 border rounded" rows={4} placeholder="Write your review here..." />
      </div>
      {/* best song */}
      <div className="mb-4">
        <input type="text" {...register("bestSong")} className="w-full p-2 border rounded" placeholder="best song" />
      </div>
      {/* worst song */}
      <div className="mb-4">
        <input type="text" {...register("worstSong")} className="w-full p-2 border rounded" placeholder="worst song" />
      </div>
      {/* dynamic color selection */}
      <div className="mb-4">
        <label>Select colors (max 5):</label>
        <div className="flex flex-wrap gap-2">
          {selectedColors.map((color, index) => (
            <div className="flex items-center gap-2" key={index}>
              <input type="color" value={color.hex} onChange={(e) => handleColorChange(index, e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
              <button type="button" onClick={() => removeColor(index)} className="text-red-500">
                ✕
              </button>
            </div>
          ))}
        </div>
        {selectedColors.length < 5 && (
          <button type="button" onClick={addColor} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Add Color
          </button>
        )}
      </div>
      {/* Genres Input Field */}
      <div className="mb-4">
        <label>Genres:</label>
        <div className="flex flex-col gap-2">
          {genreFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input {...register(`genres.${index}.name`)} className="p-2 border rounded" placeholder="Enter genre" />
              <button type="button" onClick={() => removeGenre(index)} className="text-red-500">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addGenre({ name: "" })} // Ensure new genres follow the expected object structure
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Genre
        </button>
      </div>
      {/* track ratings */}
      <TrackList tracks={displayTracks} formMethods={{ control, register, setValue }} />

      <button type="submit">Submit</button>
    </form>
  );
};

export default AlbumReviewForm;
