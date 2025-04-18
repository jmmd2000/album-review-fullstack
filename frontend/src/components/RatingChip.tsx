import { cva } from "class-variance-authority";
import { getRatingStyles } from "@/helpers/getRatingStyles";

interface RatingChipProps {
  /** The rating to display */
  rating: number;
  /** Options to specify whether or not to display the text label */
  options?: {
    textBelow?: boolean;
    small?: boolean;
    ratingString?: boolean;
  };
}

/**
 * A component that displays a rating as a chip with a gradient background and an optional text label.
 * It's primarily used in AlbumCards and on album detail pages.
 * @param {number} rating The rating to display
 * @param {{text?: boolean, small?: boolean, ratingString?: boolean}} options Options to specify whether or not to display the text label, the size of the chip, and the rating string
 */
const RatingChip = ({ rating, options }: RatingChipProps) => {
  const { label, borderColor, textColor, backgroundColorLighter } = getRatingStyles(rating);

  const cardStyles = cva(["flex", "items-center", "flex-col", "gap-1", "w-min", "mx-auto", textColor], {
    variants: {
      small: {
        false: "mt-12 mb-4",
      },
    },
  });

  const textStyles = cva([borderColor, "text-center", "rounded-lg", backgroundColorLighter, "w-max"], {
    variants: {
      small: {
        true: "border-1 text-sm px-1 rounded-sm",
        false: "border-2 text-4xl px-4 py-2",
      },
    },
  });

  return (
    <div className={cardStyles({ small: options?.small ?? false })}>
      <div className={textStyles({ small: options?.small ?? false })}>{options?.ratingString ? label : rating}</div>
      {options?.textBelow && <p className="uppercase text-center font-medium text-xl">{label}</p>}
    </div>
  );
};

export default RatingChip;
