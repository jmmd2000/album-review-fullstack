import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { client, handle, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toReviewPayload } from "@/lib/reviewForm";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { ReviewForm } from "@/components/form/ReviewForm";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";

import type { ReviewFormValues } from "@/lib/reviewForm";

async function fetchAlbumReview(albumSpotifyID: string) {
  return handle(client.api.albums[":albumID"].$get({ param: { albumID: albumSpotifyID } }));
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.edit(albumID),
    queryFn: () => fetchAlbumReview(albumID),
  });

export const Route = createFileRoute("/albums/$albumID/edit")({
  ssr: false,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(reviewQueryOptions(params.albumID)),
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} notFoundTitle="Album not found" notFoundDetail="This album has not been reviewed, or the link is wrong.">
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Edit ${loaderData.album.name}` : "Edit review" }],
  }),
});

function RouteComponent() {
  return (
    <AdminOnly>
      <EditReview />
    </AdminOnly>
  );
}

function EditReview() {
  const { albumID } = Route.useParams();
  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));
  const { album, artists, tracks } = data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const albumArtists = album.albumArtists.length > 0 ? album.albumArtists : artists.map(artist => ({ spotifyID: artist.spotifyID, name: artist.name, imageURLs: artist.imageURLs }));

  const save = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      handleVoid(
        client.api.albums[":albumID"].edit.$put({
          param: { albumID },
          json: { ...toReviewPayload(values), album: { spotifyID: album.spotifyID, artistSpotifyID: album.artistSpotifyID, albumArtists } },
        })
      ),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.albums.edit(albumID) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.home.all }),
      ]);
      await navigate({ to: "/albums/$albumID", params: { albumID } });
    },
  });

  const initialValues: ReviewFormValues = {
    tracks,
    reviewContent: album.reviewContent ?? "",
    colours: album.colors,
    genres: data.albumGenres?.map(genre => genre.name) ?? album.genres,
    affectsArtistScore: album.affectsArtistScore,
    creditedArtistIDs: album.artistSpotifyIDs?.length ? album.artistSpotifyIDs : albumArtists.map(artist => artist.spotifyID),
    scoreArtistIDs: album.artistScoreIDs ?? [],
  };

  return (
    <ReviewForm
      albumName={album.name}
      artistName={album.artistName}
      cover={album.imageURLs[0]}
      albumArtists={albumArtists}
      initialValues={initialValues}
      genreSuggestions={(data.allGenres ?? []).map(genre => genre.name)}
      onSave={values => save.mutateAsync(values)}
      onCancel={() => (canGoBack ? router.history.back() : navigate({ to: "/albums/$albumID", params: { albumID } }))}
    />
  );
}
