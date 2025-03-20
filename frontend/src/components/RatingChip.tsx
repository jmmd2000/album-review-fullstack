import { convertRatingToString } from "@/helpers/convertRatingToString";
import { convertRatingToColor } from "@/helpers/convertRatingToColor";
import { cva } from "class-variance-authority";

interface RatingChipProps {
  /** The rating to display */
  rating: number;
  /** Options to specify whether or not to display the text label */
  options?: { text?: boolean; small?: boolean };
}

/**
 * A component that displays a rating as a chip with a gradient background and an optional text label.
 * It's primarily used in AlbumCards and on album detail pages.
 * @param {number} rating The rating to display
 * @param {{text?: boolean, small?: boolean}} options Options to specify whether or not to display the text label
 */
const RatingChip = (props: RatingChipProps) => {
  const { rating, options } = props;
  // The function uses maps from 0-10 so take the first digit of the rating
  const tempRating = Math.floor(rating / 10);
  const borderColor = convertRatingToColor(tempRating, { border: true });
  const textColor = convertRatingToColor(tempRating, { text: true });
  const gradientStart = convertRatingToColor(tempRating, { gradient: true });
  const ratingString = convertRatingToString(tempRating);

  const cardStyles = cva(["flex", "items-center", "flex-col", "gap-1", "w-min", "mx-auto", textColor], {
    variants: {
      small: {
        false: "mt-12 mb-4",
      },
    },
  });

  const textStyles = cva([borderColor, "text-center", "rounded-lg", "bg-gradient-to-tr", gradientStart, "via-zinc-800/40", "to-zinc-800/40", "w-min"], {
    variants: {
      small: {
        true: "border-1 text-sm px-1 rounded-sm",
        false: "border-2 text-4xl px-4 py-2",
      },
    },
  });

  // <div className={`flex items-center flex-col gap-1 w-min mx-auto mt-12 mb-4 ${textColor} `}>
  //   <div className={`border-2 ${borderColor} text-4xl text-center px-4 py-2 rounded-lg bg-gradient-to-tr ${gradientStart} via-zinc-800/40 to-zinc-800/40 w-min`}>{rating}</div>
  //   {options?.text && <p className="uppercase text-center font-medium text-xl">{ratingString}</p>}
  // </div>;

  return (
    <div className={cardStyles({ small: options?.small ?? false })}>
      <div className={textStyles({ small: options?.small ?? false })}>{rating}</div>
      {options?.text && <p className="uppercase text-center font-medium text-xl">{ratingString}</p>}
    </div>
  );
};

export default RatingChip;
