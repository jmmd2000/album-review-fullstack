import { UseFormSetValue } from "react-hook-form";
import { CreateReviewFormData } from "./AlbumReviewForm";

interface AlbumArtist {
  spotifyID: string;
  name: string;
  imageURLs: Array<{ url: string }>;
}

interface ArtistSelectorProps {
  albumArtists: AlbumArtist[];
  watchedArtists: string[] | undefined;
  watchedScoreArtists: string[] | undefined;
  setValue: UseFormSetValue<CreateReviewFormData>;
}

const ArtistSelector = ({
  albumArtists,
  watchedArtists,
  watchedScoreArtists,
  setValue,
}: ArtistSelectorProps) => {
  if (albumArtists.length <= 1) return null;

  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-neutral-800">
      <label className="block text-zinc-200 font-medium mb-3">Album Artists</label>
      <div className="grid gap-3 sm:grid-cols-2">
        {albumArtists.map(artist => {
          const isChecked = watchedArtists?.includes(artist.spotifyID) ?? false;
          const affectsScore = watchedScoreArtists?.includes(artist.spotifyID) ?? false;
          const imageURL =
            artist.imageURLs?.[2]?.url ?? artist.imageURLs?.[0]?.url ?? "";
          return (
            <label
              key={artist.spotifyID}
              className={`flex items-center gap-3 rounded-lg border border-neutral-700/60 bg-neutral-900/40 px-3 py-2 cursor-pointer hover:border-neutral-600 ${isChecked ? "" : "opacity-60"}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  const current = watchedArtists ?? [];
                  const scoreCurrent = watchedScoreArtists ?? [];
                  if (isChecked && current.length <= 1) return;
                  const updated = isChecked
                    ? current.filter(id => id !== artist.spotifyID)
                    : [...current, artist.spotifyID];
                  setValue("selectedArtistIDs", updated, { shouldDirty: true });
                  if (isChecked) {
                    setValue(
                      "scoreArtistIDs",
                      scoreCurrent.filter(id => id !== artist.spotifyID),
                      { shouldDirty: true }
                    );
                  } else {
                    setValue(
                      "scoreArtistIDs",
                      scoreCurrent.includes(artist.spotifyID)
                        ? scoreCurrent
                        : [...scoreCurrent, artist.spotifyID],
                      { shouldDirty: true }
                    );
                  }
                }}
                className="w-4 h-4 appearance-none bg-zinc-800 border-2 border-zinc-600 rounded cursor-pointer
                  checked:bg-green-500 checked:border-green-700
                  focus:ring-green-400 focus:ring-2"
              />
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={artist.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-neutral-700 flex items-center justify-center text-sm text-neutral-200">
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-zinc-200 text-sm">{artist.name}</span>
                {albumArtists.length > 1 && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <input
                      type="checkbox"
                      checked={affectsScore}
                      disabled={!isChecked}
                      onChange={() => {
                        const scoreCurrent = watchedScoreArtists ?? [];
                        const updatedScore = affectsScore
                          ? scoreCurrent.filter(id => id !== artist.spotifyID)
                          : [...scoreCurrent, artist.spotifyID];
                        setValue("scoreArtistIDs", updatedScore, { shouldDirty: true });
                      }}
                      className="w-3 h-3 appearance-none bg-zinc-800 border border-zinc-600 rounded cursor-pointer
                        checked:bg-green-500 checked:border-green-700
                        focus:ring-green-400 focus:ring-2 disabled:opacity-50"
                    />
                    <span>Include in artist score</span>
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        At least one artist must be selected.
      </p>
    </div>
  );
};

export default ArtistSelector;
