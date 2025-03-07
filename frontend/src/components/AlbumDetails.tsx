import { ReviewedAlbum } from "@shared/types";
import RatingChip from "./RatingChip";

interface AlbumDetailsProps {
  album: ReviewedAlbum;
}

const AlbumDetails = (props: AlbumDetailsProps) => {
  const { album } = props;
  return (
    <div>
      <RatingChip rating={album.reviewScore} options={{ text: true }} />
      <p>{album.reviewContent}</p>
    </div>
  );
};

export default AlbumDetails;
