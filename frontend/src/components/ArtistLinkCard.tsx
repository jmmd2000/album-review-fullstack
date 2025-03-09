import { ReviewedArtist } from "@shared/types";
import { Link } from "@tanstack/react-router";

interface ArtistLinkCardProps {
  /** The artist data */
  artist: ReviewedArtist;
}

const ArtistLinkCard = (props: ArtistLinkCardProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <img src={props.artist.imageURLs[2].url} alt={props.artist.name} className="rounded-full h-12 w-12 shadow-2xl" />
      <div className="flex gap-2 px-0 py-1">
        <Link to={"."} className="">
          {props.artist.name}
        </Link>
      </div>
    </div>
  );
};

export default ArtistLinkCard;
