import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ApiError, client, handle, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toReviewPayload } from "@/lib/reviewForm";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { ReviewForm } from "@/components/form/ReviewForm";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";

import type { ReviewFormValues } from "@/lib/reviewForm";

async function fetchAlbumFromSpotify(albumSpotifyID: string) {
  return handle(client.api.spotify.albums[":albumID"].$get({ param: { albumID: albumSpotifyID } }));
}

const spotifyAlbumQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.create(albumID),
    queryFn: () => fetchAlbumFromSpotify(albumID),
  });

export const Route = createFileRoute("/albums/$albumID/create")({
  ssr: false,
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(spotifyAlbumQueryOptions(params.albumID));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) throw redirect({ to: "/albums/$albumID", params: { albumID: params.albumID } });
      if (error instanceof ApiError && error.status === 401) return undefined;
      throw error;
    }
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} notFoundTitle="Album not found" notFoundDetail="Spotify has no album with this link.">
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Review ${loaderData.album.name}` : "New review" }],
  }),
});

function RouteComponent() {
  return (
    <AdminOnly>
      <CreateReview />
    </AdminOnly>
  );
}

function CreateReview() {
  const { albumID } = Route.useParams();
  const { data } = useSuspenseQuery(spotifyAlbumQueryOptions(albumID));
  const { album, artists } = data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const save = useMutation({
    mutationFn: (values: ReviewFormValues) => handleVoid(client.api.albums.create.$post({ json: { ...toReviewPayload(values), album } })),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.albums.create(albumID) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.home }),
      ]);
      await navigate({ to: "/albums/$albumID", params: { albumID } });
    },
  });

  const artistIDs = artists.map(artist => artist.spotifyID);
  const initialValues: ReviewFormValues = {
    tracks: album.tracks.items.map(track => ({
      spotifyID: track.id,
      artistSpotifyID: track.artists[0]?.id ?? album.artists[0]!.id,
      artistName: track.artists[0]?.name ?? album.artists[0]!.name,
      name: track.name,
      duration: track.duration_ms,
      features: track.artists.slice(1).map(artist => ({ id: artist.id, name: artist.name })),
      rating: 0,
      pick: null,
    })),
    reviewContent: "",
    colours: album.colors,
    genres: [],
    affectsArtistScore: true,
    creditedArtistIDs: artistIDs,
    scoreArtistIDs: artistIDs,
  };

  return (
    <ReviewForm
      albumName={album.name}
      artistName={album.artists.map(artist => artist.name).join(", ")}
      cover={album.images[0]}
      albumArtists={artists}
      initialValues={initialValues}
      genreSuggestions={(data.genres ?? []).map(genre => genre.name)}
      onSave={values => save.mutateAsync(values)}
      onCancel={() => (canGoBack ? router.history.back() : navigate({ to: "/albums" }))}
    />
  );
}
