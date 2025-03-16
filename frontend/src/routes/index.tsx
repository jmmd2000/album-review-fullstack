import AlbumRow from "@components/AlbumRow";
import { queryClient } from "@/main";
import { ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@components/ErrorComponent";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAllAlbums(): Promise<{ topArtists: ReviewedArtist[]; topAlbums: ReviewedAlbum[]; numArtists: number; numAlbums: number; numTracks: number }> {
  const response = await fetch(`${API_BASE_URL}/api/artists/stats`);
  return await response.json();
}

const statsQueryOptions = queryOptions({
  queryKey: ["home"],
  queryFn: fetchAllAlbums,
});

export const Route = createFileRoute("/")({
  loader: () => queryClient.ensureQueryData(statsQueryOptions),
  component: Index,
  errorComponent: ErrorComponent,
});

function Index() {
  const { data } = useQuery(statsQueryOptions);
  if (!data) return <div>Loading...</div>;
  console.log(data);
  return (
    <div className="flex">
      <div className="bg-green-800">
        <IntroductoryText />
      </div>
      <div className="bg-orange-800">
        <HomeStats {...data} />
      </div>
    </div>
  );
}

const IntroductoryText = () => {
  const ratings = ["Perfect", "Amazing", "Brilliant", "Great", "Good", "Meh", "OK", "Bad", "Awful", "Terrible", "Non-song"];
  return (
    <div className="flex flex-col p-8 md:p-16">
      <h1 className="mb-5 text-2xl font-semibold text-white sm:text-3xl">Hey there!</h1>
      <p className="mb-8 text-lg font-light text-gray-50 sm:text-xl">
        Welcome to my album reviews. This is a personal project I built to keep track of new albums and what I think of them. Each review is based on my own enjoyment of the album, rather than technical standards.
      </p>
      <p className="mb-5 text-xl font-light text-gray-50">Each song in an album is given a rating as follows:</p>

      <div className="mb-8 grid max-w-max grid-cols-3 gap-2 md:grid-cols-5 lg:gap-4 xl:grid-cols-6">
        {/* {ratings.map((rating, index) => (
          <RatingCard rating={rating} key={index} form="medium" />
        ))} */}
      </div>

      <p className="mb-10 text-xl font-light text-gray-50">
        You can see a few of my top artists here also. I also have a{" "}
        <a href="https://open.spotify.com/playlist/7f87l51cuxevxtd34mjSUs?si=8655c0cd75ff4711" target="blank" className="text-fuchsia-400 hover:underline">
          Spotify playlist
        </a>{" "}
        of all the songs I&apos;ve rated as <i>Perfect.</i>
      </p>
      <p className="mb-5 text-xl font-light text-gray-50">Thanks for visiting!</p>
      <p className="mb-5 text-xl font-light text-gray-50">James.</p>
    </div>
  );
};

interface HomeStatsProps {
  topArtists: ReviewedArtist[];
  topAlbums: ReviewedAlbum[];
  numArtists: number;
  numAlbums: number;
  numTracks: number;
}

const HomeStats = (props: HomeStatsProps) => {
  const { topArtists, topAlbums, numArtists, numAlbums, numTracks } = props;
  return (
    <div className="flex flex-col p-8 md:p-16">
      <AlbumRow albums={topAlbums} />
    </div>
  );
};
