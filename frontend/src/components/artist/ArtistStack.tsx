import { Link } from "@tanstack/react-router";

type ArtistStackItem = {
  spotifyID: string;
  name: string;
  imageURLs: { url: string }[];
};

interface ArtistStackProps {
  artists: ArtistStackItem[];
  linkable?: boolean;
  size?: number;
  maxVisible?: number;
}

const ArtistStack = ({
  artists,
  linkable = false,
  size = 48,
  maxVisible = 4,
}: ArtistStackProps) => {
  const visibleArtists = artists.slice(0, maxVisible);
  const overflow = artists.length - visibleArtists.length;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center">
        {visibleArtists.map((artist, index) => {
          const imageURL =
            artist.imageURLs?.[2]?.url ?? artist.imageURLs?.[0]?.url ?? "";
          const wrapperClass = `rounded-lg border border-neutral-800/15 bg-neutral-800/70 transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md ${index === 0 ? "" : "-ml-2"}`;
          return linkable ? (
            <Link
              key={artist.spotifyID}
              params={{ artistID: artist.spotifyID }}
              to="/artists/$artistID"
              viewTransition
              className={wrapperClass}
              style={{ width: size, height: size }}
            >
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={artist.name}
                  className="h-full w-full rounded-lg object-cover"
                  style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
                />
              ) : (
                <div
                  className="h-full w-full rounded-lg flex items-center justify-center text-xs text-neutral-200"
                  style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
                >
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <div
              key={artist.spotifyID}
              className={wrapperClass}
              style={{ width: size, height: size }}
            >
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={artist.name}
                  className="h-full w-full rounded-lg object-cover"
                  style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
                />
              ) : (
                <div
                  className="h-full w-full rounded-lg flex items-center justify-center text-xs text-neutral-200"
                  style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
                >
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        {overflow > 0 && (
          <div
            className="-ml-2 rounded-lg border border-neutral-700/15 bg-neutral-800 text-xs text-neutral-200 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            +{overflow}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-300 truncate">
        {artists.map((artist, index) => {
          const suffix = index < artists.length - 1 ? ", " : "";
          return linkable ? (
            <span key={artist.spotifyID}>
              <Link
                params={{ artistID: artist.spotifyID }}
                to="/artists/$artistID"
                className="hover:underline"
                viewTransition
              >
                {artist.name}
              </Link>
              {suffix}
            </span>
          ) : (
            <span key={artist.spotifyID}>
              {artist.name}
              {suffix}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default ArtistStack;
