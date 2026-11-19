import { useCallback, useState } from "react";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ApiError, client, handle, handleVoid } from "@/lib/client";
import { notFoundOn404 } from "@/lib/notFoundOn404";
import { queryKeys } from "@/lib/queryKeys";
import { toReviewPayload } from "@/lib/reviewForm";
import { restoreDraft } from "@/lib/reviewDraft";
import { useDraftAutosave } from "@/hooks/useDraftAutosave";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { ReviewForm } from "@/components/form/ReviewForm";
import { DraftNotice, DraftStatus } from "@/components/form/DraftNotice";
import { RouteError } from "@/components/ui/RouteError";
import { NotFound } from "@/components/layout/NotFound";
import { ButtonLink } from "@/components/ui/ButtonLink";

import type { ReviewFormValues } from "@/lib/reviewForm";

async function fetchAlbumFromSpotify(albumSpotifyID: string) {
  return handle(client.api.spotify.albums[":albumID"].$get({ param: { albumID: albumSpotifyID }, query: {} }));
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
      // Always fetched, so the form starts from the latest draft rather than a copy cached on an earlier visit
      return await notFoundOn404(context.queryClient.fetchQuery(spotifyAlbumQueryOptions(params.albumID)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) throw redirect({ to: "/albums/$albumID", params: { albumID: params.albumID } });
      if (error instanceof ApiError && error.status === 401) return undefined;
      throw error;
    }
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <NotFound kind="album" title="Album not found" detail="Spotify has no album with this link.">
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </NotFound>
  ),
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset}>
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
  const [draft, setDraft] = useState(data.draft);
  const [formKey, setFormKey] = useState(0);
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
        queryClient.invalidateQueries({ queryKey: queryKeys.discover }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.home.all }),
      ]);
      await navigate({ to: "/albums/$albumID", params: { albumID } });
    },
  });

  const saveDraft = useCallback(
    (values: ReviewFormValues, keepalive: boolean) =>
      handleVoid(
        client.api.drafts[":albumID"].$put(
          {
            param: { albumID },
            json: {
              formValues: values,
              album: {
                name: album.name,
                artistName: album.artists[0].name,
                artistSpotifyID: album.artists[0].id,
                releaseYear: new Date(album.release_date).getFullYear(),
                imageURLs: album.images,
              },
            },
          },
          { init: { keepalive } }
        )
      ),
    [albumID, album]
  );
  const autosave = useDraftAutosave(saveDraft);

  const discardDraft = async () => {
    autosave.stop();
    try {
      await handleVoid(client.api.drafts[":albumID"].$delete({ param: { albumID } }));
      setDraft(null);
      setFormKey(key => key + 1);
    } finally {
      autosave.resume();
    }
  };
  // A change saved over a draft that couldn't be loaded replaces it, so its notice no longer applies
  const showDraftNotice = draft !== null && (draft.formValues !== null || autosave.status.state !== "saved");

  const artistIDs = artists.map(artist => artist.spotifyID);
  const freshValues: ReviewFormValues = {
    tracks: album.tracks.items.map(track => ({
      spotifyID: track.id,
      artistSpotifyID: track.artists[0]?.id ?? album.artists[0].id,
      artistName: track.artists[0]?.name ?? album.artists[0].name,
      name: track.name,
      duration: track.duration_ms,
      features: track.artists.slice(1).map(artist => ({ id: artist.id, name: artist.name })),
      rating: 0,
      pick: null,
    })),
    reviewContent: "",
    bonus: 0,
    colours: album.colors,
    genres: [],
    affectsArtistScore: true,
    creditedArtistIDs: artistIDs,
    scoreArtistIDs: artistIDs,
  };
  const initialValues = draft?.formValues ? restoreDraft(freshValues, draft.formValues) : freshValues;

  return (
    <ReviewForm
      key={formKey}
      albumID={albumID}
      albumName={album.name}
      artistName={album.artists.map(artist => artist.name).join(", ")}
      cover={album.images[0]}
      albumArtists={artists}
      initialValues={initialValues}
      genreOptions={data.genres ?? []}
      onChange={autosave.change}
      notice={showDraftNotice && <DraftNotice savedAt={new Date(draft.updatedAt)} loaded={draft.formValues !== null} onDiscard={discardDraft} />}
      status={<DraftStatus status={autosave.status} />}
      onSave={async values => {
        autosave.stop();
        try {
          return await save.mutateAsync(values);
        } catch (error) {
          autosave.resume();
          throw error;
        }
      }}
      onCancel={() => {
        if (canGoBack) {
          router.history.back();
          return;
        }
        void navigate({ to: "/albums" });
      }}
    />
  );
}
