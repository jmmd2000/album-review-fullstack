interface ImageComparisonProps {
  /** The image URL before the change */
  beforeImage?: string;
  /** The image URL after the change */
  afterImage?: string;
  /** The name of the artist */
  artistName: string;
  /** Optional size for the images, defaults to 'w-8 h-8' */
  size?: string;
  /** Type of image, either 'profile' or 'header', defaults to 'profile' */
  type?: "profile" | "header";
}

const ImageComparison = ({
  beforeImage,
  afterImage,
  artistName,
  size = "w-8 h-8",
  type = "profile",
}: ImageComparisonProps) => {
  const isHeader = type === "header";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <ImageComponent
          url={beforeImage}
          isHeader={isHeader}
          artistName={artistName}
          size={size}
        />
        <span className="text-xs text-neutral-500">→</span>
        <ImageComponent
          url={afterImage}
          isHeader={isHeader}
          artistName={artistName}
          size={size}
        />
      </div>
    </div>
  );
};

export default ImageComparison;

interface ImageComponentProps {
  /** The image URL to display */
  url?: string;
  /** Whether this is a header image */
  isHeader: boolean;
  /** The name of the artist, used for fallback text */
  artistName: string;
  /** Optional size for the image, defaults to 'w-8 h-8' */
  size?: string;
}

const ImageComponent = ({
  url,
  isHeader,
  artistName,
  size = "w-8 h-8",
}: ImageComponentProps) => {
  if (!url) {
    return (
      <div
        className={`${size} ${isHeader ? "rounded" : "rounded-full"} bg-neutral-700 flex items-center justify-center text-xs text-neutral-400`}
      >
        {artistName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${size} relative`}>
      <img
        src={url}
        alt={`${artistName} ${isHeader ? "header" : "profile"}`}
        className={`${size} ${isHeader ? "rounded" : "rounded-full"} object-cover bg-neutral-700`}
        onError={e => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className={`${size} ${isHeader ? "rounded" : "rounded-full"} bg-neutral-700 items-center justify-center text-xs text-neutral-400 absolute inset-0 hidden`}
      >
        {artistName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};
