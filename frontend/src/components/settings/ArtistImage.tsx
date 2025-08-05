interface ArtistImageProps {
  /** The image URL of the artist */
  imageUrl?: string;
  /** The name of the artist */
  artistName: string;
  /** Optional size for the image, defaults to 'w-6 h-6' */
  size?: string;
}

const ArtistImage = ({
  imageUrl,
  artistName,
  size = "w-6 h-6",
}: ArtistImageProps) => {
  if (!imageUrl) {
    return (
      <div
        className={`${size} rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-400`}
      >
        {artistName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${size} relative`}>
      <img
        src={imageUrl}
        alt={artistName}
        className={`${size} rounded-full object-cover bg-neutral-700`}
        onError={e => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className={`${size} rounded-full bg-neutral-700 items-center justify-center text-xs text-neutral-400 absolute inset-0 hidden`}
      >
        {artistName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

export default ArtistImage;
