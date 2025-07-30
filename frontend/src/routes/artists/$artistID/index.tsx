import ErrorComponent from "@components/ErrorComponent";
import { queryClient } from "@/main";
import { DisplayAlbum, DisplayTrack, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import HeaderDetails from "@/components/HeaderDetails";
import RatingChip from "@/components/RatingChip";
import { Crown, Medal, Trophy } from "lucide-react";
import CardGrid from "@/components/CardGrid";
import AlbumCard from "@/components/AlbumCard";
import { useEffect } from "react";
import TrackList from "@/components/TrackList";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchReviewedArtist(
  artistSpotifyID: string
): Promise<{
  artist: ReviewedArtist;
  albums: DisplayAlbum[];
  tracks: DisplayTrack[];
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/artists/details/${artistSpotifyID}`
  );
  return await response.json();
}

const artistQueryOptions = (artistID: string) =>
  queryOptions({
    queryKey: ["artistID", artistID],
    queryFn: () => fetchReviewedArtist(artistID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/artists/$artistID/")({
  loader: async ({ params }) => {
    return queryClient.ensureQueryData(artistQueryOptions(params.artistID));
  },
  errorComponent: ErrorComponent,
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.artist?.name,
      },
    ],
  }),
});

function RouteComponent() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const { artistID } = useParams({ strict: false });
  if (!artistID) {
    throw new Error("artistID is undefined");
  }

  const data = useSuspenseQuery(artistQueryOptions(artistID));

  const artist = data.data.artist;
  const albums = data.data.albums;
  const tracks = data.data.tracks;

  const albumString =
    albums.length > 1 ? `${albums.length} albums` : `${albums.length} album`;

  const podiumCheck = (pos: number) => {
    if (pos === 1) return <Crown color="#d4af37" size={16} />;
    if (pos === 2) return <Trophy color="#C0C0C0" size={16} />;
    if (pos === 3) return <Medal color="#CD7F32" size={16} />;
  };

  return (
    <div>
      <div
        className="relative w-full h-[600px] md:h-[500px] pb-28 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `
      linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(23,23,23,0.1) 50%, #171717 100%),
      url(${artist.headerImage})
    `,
        }}
      >
        <HeaderDetails
          name={artist.name}
          imageURL={artist.imageURLs[1].url}
          viewTransitionName={`artist-image-${artist.spotifyID}`}
          nameBackground
        />
        <div className="w-full mt-4 md:mt-0 px-4 md:w-[90%] lg:w-[70%] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-evenly gap-3 py-2">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
              {/* <span className="hidden sm:inline mx-2 text-gray-500">•</span> */}
              <p className="text-gray-400">{albumString}</p>
              <span className="mx-2 text-gray-500">•</span>
              <p className="text-gray-400">{tracks.length} tracks</p>
              {artist.unrated ? (
                <>
                  <span className="mx-2 text-gray-500">•</span>
                  <p className="text-gray-400 flex items-center gap-1">
                    Unrated
                  </p>
                </>
              ) : (
                <>
                  <span className="mx-2 text-gray-500">•</span>
                  <p className="text-gray-400 flex items-center gap-1">
                    Rank #{artist.leaderboardPosition}
                    {podiumCheck(artist.leaderboardPosition)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-16">
        <RatingChip
          rating={Math.ceil(artist.totalScore)}
          options={{ textBelow: true }}
        />
      </div>
      <div className="mx-auto max-w-[80ch]">
        <TrackList tracks={tracks} sortByRating maxHeight="500px" />
      </div>
      <CardGrid
        cards={albums.map(album => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
        heading={`Albums by ${artist.name}`}
      />
    </div>
  );
}
