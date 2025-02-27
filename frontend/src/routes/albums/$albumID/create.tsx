import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { queryClient } from "../../../main";
import { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExtractedColor, SpotifyAlbum } from "@shared/types";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import BlurryHeader from "../../../components/BlurryHeader";
const API_BASE_URL = import.meta.env.VITE_API_URL;

//# --------------------------------------------------------------------------------------------- #
//# The usual structure for a route would be like:
// const tokenQueryOptions = queryOptions({
//   queryKey: ["album"],
//   queryFn: fetchToken,
// });
//# And this would be passed to the loader in createFileRoute() like:
// loader: () => queryClient.ensureQueryData(tokenQueryOptions),
//# But in this case, the query function needs a parameter, so we need to pass the param to queryOptions directly:
// const albumQueryOptions = (albumSpotifyID: string) =>
// queryOptions({
//   queryKey: ["spotifyAlbum", albumSpotifyID],
//   queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
// });
//# Then, in the loader:
// loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
//# And then inside the RouteComponent, you need to pass the same options to useQuery:
// const { albumID } = useParams({ strict: false });
//   if (!albumID) {
//     throw new Error("albumID is undefined");
//   }
//   const { data } = useSuspenseQuery(albumQueryOptions(albumID));
//# No need for error as the error boundary is already handled by the ErrorComponent
//# No need for isPending as it's called with useSuspenseQuery, which handles the loading state
//# --------------------------------------------------------------------------------------------- #

async function fetchAlbumFromSpotify(albumSpotifyID: string): Promise<SpotifyAlbum> {
  const response = await fetch(`${API_BASE_URL}/api/spotify/albums/${albumSpotifyID}`);
  return await response.json();
}

const albumQueryOptions = (albumSpotifyID: string) =>
  queryOptions({
    queryKey: ["spotifyAlbum", albumSpotifyID],
    queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
  });

const ErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    // Reset the query error boundary
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {error.message}
      <button
        onClick={() => {
          // Invalidate the route to reload the loader, and reset any router error boundaries
          router.invalidate();
        }}
      >
        retry
      </button>
    </div>
  );
};

// This page is for creating a new album review

export const Route = createFileRoute("/albums/$albumID/create")({
  loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
  component: RouteComponent,
  errorComponent: ErrorComponent,
});

/**
 * Represents the data submitted when creating a new review
 */
type CreateReviewFormData = {
  /*** An array of track IDs and their ratings*/
  tracks: { id: string; rating: number }[];
  /*** The best song on the album */
  bestSong: string;
  /*** The worst song on the album */
  worstSong: string;
  /*** The review content */
  reviewContent: string;
  /*** The selected colors */
  colors: ExtractedColor[];
};

function RouteComponent() {
  // Get the album ID from the URL
  const { albumID } = useParams({ strict: false });

  console.log({ albumID });
  // If the album ID is undefined, throw an error
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  // Fetch the album data
  const { data } = useSuspenseQuery(albumQueryOptions(albumID));

  console.log({ data });

  // Initialize the form
  const { control, register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      // tracks: album.tracks?.items.map((item) => ({ id: item.id, rating: Math.floor(Math.random() * 11) })) || [], // default all ratings to a random number from 0-10
      tracks: album.tracks?.items.map((item) => ({ id: item.id, rating: 0 })) || [], // default all ratings to 0
      bestSong: "",
      worstSong: "",
      reviewContent: "",
      colors: [...album.colors] as ExtractedColor[],
    },
  });

  // UseFieldArray for dynamic track ratings
  const { fields } = useFieldArray({
    control,
    name: "tracks",
  });

  // These are the colors for the BlurryHeader picked by the user
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>([...extractedColors]);

  // Sync selectedColors with the form state
  useEffect(() => {
    setValue("colors", selectedColors);
  }, [selectedColors, setValue]);

  // Adds a new color input, max 5
  const addColor = () => {
    if (selectedColors.length < 5) {
      // Default new color is white
      setSelectedColors((prev) => [...prev, { hex: "#ffffff" }]);
    }
  };

  // Remove a color at a specific index
  const removeColor = (index: number) => {
    setSelectedColors((prevColors) => prevColors.filter((_, i) => i !== index));
  };

  // Updates the selectedColors array with the new color
  const handleColorChange = (index: number, newColor: string) => {
    setSelectedColors((prevColors) => {
      const newColors = [...prevColors];
      newColors[index] = { hex: newColor };
      return newColors;
    });
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

    console.log(response);
    console.log(formData);
  };

  // If there's no data, show an error
  if (!album) {
    return <div>No data</div>;
  }

  return (
    <>
      <BlurryHeader colors={selectedColors}>
        <h1>{album.name}</h1>
        <img src={album.images[1].url} alt={album.name} />
        <p>{album.artists.map((artist) => artist.name).join(", ")}</p>
        <p>{album.release_date}</p>
        <p>{album.total_tracks} tracks</p>
      </BlurryHeader>

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
              <div className="flex items-center gap-2">
                <input key={index} type="color" value={color.hex} onChange={(e) => handleColorChange(index, e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
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
              Track {album.tracks.items[index].track_number}: {album.tracks.items[index].name}
            </p>

            {/* track ID (hidden but included in form data) */}
            <input type="hidden" {...control.register(`tracks.${index}.id`)} />

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
    </>
  );
}

// interface TrackCardProps {
//   trackNumber: number;
//   name: string;
//   duration_ms: number;
//   trackID: string;
// }

// const TrackCard = (props: TrackCardProps) => {
//   const { trackNumber, name, duration_ms } = props;
//   return (
//     <div className="flex justify-between">
//       <p>
//         {trackNumber}. {name}
//       </p>
//       <p>{duration_ms / 1000}</p>
//     </div>
//   );
// };
