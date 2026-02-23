import ErrorComponent from "@components/ui/ErrorComponent";
import { queryClient } from "@/main";
import { DisplayAlbum, DisplayTrack, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import HeaderDetails from "@/components/layout/HeaderDetails";
import RatingChip from "@/components/ui/RatingChip";
import { Crown, Medal, Trophy } from "lucide-react";
import CardGrid from "@/components/ui/CardGrid";
import AlbumCard from "@/components/album/AlbumCard";
import { useEffect } from "react";
import TrackList from "@/components/track/TrackList";
import { api } from "@/lib/api";

async function fetchReviewedArtist(artistSpotifyID: string): Promise<{
  artist: ReviewedArtist;
  albums: DisplayAlbum[];
  featuredAlbums: DisplayAlbum[];
  tracks: DisplayTrack[];
}> {
  return api.get<{
    artist: ReviewedArtist;
    albums: DisplayAlbum[];
    featuredAlbums: DisplayAlbum[];
    tracks: DisplayTrack[];
  }>(`/api/artists/details/${artistSpotifyID}`);
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
  const featuredAlbums = data.data.featuredAlbums ?? [];
  const tracks = data.data.tracks;
  const artistImageURL = artist.imageURLs?.[1]?.url ?? artist.imageURLs?.[0]?.url;
  const artistLargeImageURL = artist.imageURLs?.[0]?.url;

  const albumString = albums.length > 1 ? `${albums.length} albums` : `${albums.length} album`;

  const podiumCheck = (pos: number) => {
    if (pos === 1) return <Crown color="#d4af37" size={16} />;
    if (pos === 2) return <Trophy color="#C0C0C0" size={16} />;
    if (pos === 3) return <Medal color="#CD7F32" size={16} />;
  };

  return (
    <div>
      <div
        className="relative w-full h-150 md:h-125 3xl:h-200 pb-28 3xl:pt-28 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `
      linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(23,23,23,0.1) 50%, #171717 100%),
      url(${artist.headerImage})
    `,
        }}
      >
        <HeaderDetails
          name={artist.name}
          imageURL={artistImageURL}
          largeImageURL={artistLargeImageURL}
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
                  <p className="text-gray-400 flex items-center gap-1">Unrated</p>
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

      {/* Artist Scores Section */}
      <div className="mb-16 flex justify-center items-center gap-8">
        {artist.unrated ? (
          <div className="flex flex-col items-center gap-2">
            <RatingChip rating={0} options={{ textBelow: true }} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-gray-400">Unrated</span>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Score - Primary */}
            <div className="flex flex-col items-center gap-2">
              <RatingChip
                rating={Math.ceil(artist.totalScore)}
                options={{ textBelow: true }}
                tooltipContent={{
                  title: "Overall Score",
                  description:
                    "Average of all contributing albums plus quality bonuses and penalties. This is the artist's primary score used for ranking.",
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-gray-400">Overall</span>
                {artist.leaderboardPosition && (
                  <span className="text-xs text-gray-500">
                    Rank #{artist.leaderboardPosition}
                  </span>
                )}
              </div>
            </div>

            {/* Peak Score */}
            <div className="flex flex-col items-center gap-2">
              <RatingChip
                rating={Math.ceil(artist.peakScore)}
                options={{ textBelow: true }}
                tooltipContent={{
                  title: "Peak Score",
                  description:
                    "Average of the artist's top 3 highest-rated albums plus bonuses. Shows the artist's potential at their best.",
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-gray-400">Peak</span>
                {artist.peakLeaderboardPosition && (
                  <span className="text-xs text-gray-500">
                    Rank #{artist.peakLeaderboardPosition}
                  </span>
                )}
              </div>
            </div>

            {/* Latest Score */}
            <div className="flex flex-col items-center gap-2">
              <RatingChip
                rating={Math.ceil(artist.latestScore)}
                options={{ textBelow: true }}
                tooltipContent={{
                  title: "Latest Score",
                  description:
                    "Average of the artist's latest 3 albums (by release year) plus bonuses. Shows the artist's current form and recent quality.",
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-gray-400">Latest</span>
                {artist.latestLeaderboardPosition && (
                  <span className="text-xs text-gray-500">
                    Rank #{artist.latestLeaderboardPosition}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
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
      {featuredAlbums.length > 0 && (
        <CardGrid
          cards={featuredAlbums.map(album => (
            <AlbumCard key={album.spotifyID} album={album} />
          ))}
          heading="Featured on"
        />
      )}
    </div>
  );
}
