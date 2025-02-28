import { DisplayTrack, ExtractedColor, ReviewedAlbum, ReviewedTrack, SpotifyAlbum } from "@shared/types";
import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
type CreateReviewFormData = {
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

const AlbumReviewForm = (props: AlbumReviewFormProps) => {
  const { album, tracks, setSelectedColors, selectedColors } = props;

  let displayTracks: DisplayTrack[] = [];
  if (isReviewedAlbum(album)) {
    displayTracks = tracks!.map((track) => ({
      rating: track.rating,
      name: track.name,
      artistName: track.artistName,
      duration: track.duration,
      features: JSON.parse(track.features),
      spotifyID: track.spotifyID,
      artistSpotifyID: track.artistSpotifyID,
    })) as DisplayTrack[];
  } else {
    displayTracks = album.tracks.items.map((track) => ({
      rating: 0,
      name: track.name,
      artistName: track.artists[0].name,
      duration: track.duration_ms,
      features: track.artists.slice(1).map((artist) => ({ name: artist.name })),
      spotifyID: track.id,
      artistSpotifyID: track.artists[0].id,
    })) as DisplayTrack[];
  }

  const colors: ExtractedColor[] = isReviewedAlbum(album) ? JSON.parse(album.colors) : album.colors;

  useEffect(() => {
    setSelectedColors(colors);
  }, [album]);

  // Initialize the form
  const { control, register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      tracks: displayTracks,
      bestSong: isReviewedAlbum(album) ? album.bestSong : "",
      worstSong: isReviewedAlbum(album) ? album.worstSong : "",
      reviewContent: isReviewedAlbum(album) ? album.reviewContent || "" : "",
      colors: selectedColors,
    },
  });

  // UseFieldArray for dynamic track ratings
  const { fields } = useFieldArray({
    control,
    name: "tracks",
  });

  // Sync selectedColors with the form state
  useEffect(() => {
    setValue("colors", selectedColors);
  }, [selectedColors, setValue]);

  // Adds a new color input, max 5
  const addColor = () => {
    // if (colors.length < 5) {
    //   // Default new color is white
    //   setSelectedColors((prev) => [...prev, { hex: "#ffffff" }]);
    // }
    if (selectedColors.length < 5) {
      const updatedColors = [...selectedColors, { hex: "#ffffff" }];
      setSelectedColors(updatedColors);
    }
  };

  // Remove a color at a specific index
  const removeColor = (index: number) => {
    // setSelectedColors((prevColors) => prevColors.filter((_, i) => i !== index));
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

    // Submit the form
    const response = await fetch(`${API_BASE_URL}/api/albums/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        album: album,
        reviewContent: formData.reviewContent,
        bestSong: formData.bestSong,
        worstSong: formData.worstSong,
        ratedTracks: formData.tracks,
        colors: colorsToSubmit,
      }),
    });

    if (!response.ok) {
      console.error("Failed to submit review:", response.statusText);
    } else {
      console.log("Review submitted successfully");
    }

    // console.log(response);
    console.log(formData);
  };

  //   // If there's no data, show an error
  //   if (!album) {
  //     return <div>No data</div>;
  //   }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* review content */}
      <div className="mb-4">
        <label>Review:</label>
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

      {/* track ratings */}
      {fields.map((field, index) => (
        <div key={field.id} className="mb-4">
          <p>
            Track {index + 1}: {displayTracks[index].name} - {displayTracks[index].artistName}
          </p>

          {/* track ID (hidden but included in form data) */}
          <input type="hidden" {...control.register(`tracks.${index}.spotifyID`)} />

          {/* Rating select */}
          <Controller
            control={control}
            name={`tracks.${index}.rating`}
            render={({ field }) => (
              <select {...field} className="bg-green-900">
                {[...Array(11)].map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      ))}

      <button type="submit">Submit</button>
    </form>
    // <div>Album Review Form</div>
  );
};

export default AlbumReviewForm;
