import { useQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { queryClient } from "../../../main";
import { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { SpotifyAlbum } from "../../../../types";
import { Controller, useFieldArray, useForm } from "react-hook-form";
const API_BASE_URL = import.meta.env.VITE_API_URL;

//# --------------------------------------------------------------------------------------------- #
//# The usual structure for a route would be like:
// const tokenQueryOptions = queryOptions({
//   queryKey: ["token"],
//   queryFn: fetchToken,
// });
//# And this would be passed to the loader in createFileRoute() like:
// loader: () => queryClient.ensureQueryData(tokenQueryOptions),
//# But in this case, the loader needs a parameter, so we need to pass queryOptions directly:
// loader: ({ params: { albumID } }) =>
//   queryClient.ensureQueryData({
//     queryKey: ["spotifyAlbum", albumID],
//     queryFn: () => fetchAlbumFromSpotify(albumID),
//   }),
//# And then inside the RouteComponent, you need to pass the same options to useQuery:
// const { albumID } = useParams({
//   from: "/albums/$albumID/create",
//   select: (params) => ({ albumID: params.albumID }),
// });
//
// const { data, error, isPending } = useQuery({ queryKey: ["spotifyAlbum", albumID], queryFn: ({ queryKey }) => fetchAlbumFromSpotify(queryKey[1]) });
//# --------------------------------------------------------------------------------------------- #

async function fetchAlbumFromSpotify(albumSpotifyID: string): Promise<SpotifyAlbum> {
  const response = await fetch(`${API_BASE_URL}/api/spotify/albums/${albumSpotifyID}`);
  return await response.json();
}

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

export const Route = createFileRoute("/albums/$albumID/create")({
  loader: ({ params: { albumID } }) =>
    queryClient.ensureQueryData({
      queryKey: ["spotifyAlbum", albumID],
      queryFn: () => fetchAlbumFromSpotify(albumID),
    }),
  component: RouteComponent,
  errorComponent: ErrorComponent,
});

type CreateReviewFormData = {
  tracks: { id: string; rating: number }[];
  bestSong: string;
  worstSong: string;
  reviewContent: string;
};

function RouteComponent() {
  const { albumID } = useParams({
    from: "/albums/$albumID/create",
    select: (params) => ({ albumID: params.albumID }),
  });
  console.log({ albumID });
  const { data, error, isPending } = useQuery({ queryKey: ["spotifyAlbum", albumID], queryFn: ({ queryKey }) => fetchAlbumFromSpotify(queryKey[1]) });
  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      tracks: data?.tracks?.items.map((item) => ({ id: item.id, rating: 0 })) || [], // default all ratings to 0
      bestSong: "",
      worstSong: "",
      reviewContent: "",
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "tracks",
  });

  const onSubmit = async (formData: CreateReviewFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/albums/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        album: data,
        reviewContent: formData.reviewContent,
        bestSong: formData.bestSong,
        worstSong: formData.worstSong,
        ratedTracks: formData.tracks,
      }),
    });

    if (!response.ok) {
      console.error("Failed to submit review:", response.statusText);
    } else {
      console.log("Note submitted successfully");
    }

    console.log(response);
    console.log(formData);
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error instanceof Error) {
    return <div>An error occurred: {error.message}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <>
      <h1>{data.name}</h1>
      <img src={data.images[1].url} alt={data.name} />
      <p>{data.artists.map((artist) => artist.name).join(", ")}</p>
      <p>{data.release_date}</p>
      <p>{data.total_tracks} tracks</p>

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

        {/* track ratings */}
        {fields.map((field, index) => (
          <div key={field.id} className="mb-4">
            <p>
              Track {data.tracks.items[index].track_number}: {data.tracks.items[index].name}
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
