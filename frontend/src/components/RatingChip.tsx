import { convertRatingToString } from "../helpers/convertRatingToString";
import { convertRatingToColor } from "../helpers/convertRatingToColor";

interface RatingChipProps {
  /** The rating to display */
  rating: number;
  /** Options to specify whether or not to display the text label */
  options?: { text?: boolean };
}

/**
 * A component that displays a rating as a chip with a gradient background and an optional text label.
 * It's primarily used in AlbumCards and on album detail pages.
 */
const RatingChip = (props: RatingChipProps) => {
  const { rating, options } = props;
  // The function uses maps from 0-10 so take the first digit of the rating
  const tempRating = Math.floor(rating / 10);
  const borderColor = convertRatingToColor(tempRating, { border: true });
  const textColor = convertRatingToColor(tempRating, { text: true });
  const gradientStart = convertRatingToColor(tempRating, { gradient: true });
  const ratingString = convertRatingToString(tempRating);

  return (
    <div className={`flex items-center flex-col gap-1 w-min mx-auto ${textColor} `}>
      <div className={`border-2 ${borderColor} text-2xl text-center px-4 py-2 rounded-lg bg-gradient-to-tr ${gradientStart} via-zinc-800/40 to-zinc-800/40 w-min`}>{rating}</div>
      {options?.text && <p className="uppercase text-center font-medium text-xl">{ratingString}</p>}
    </div>
  );
};

export default RatingChip;
