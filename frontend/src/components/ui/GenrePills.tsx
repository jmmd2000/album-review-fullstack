import { Genre } from "@shared/types";
import { Link } from "@tanstack/react-router";

/**
 * The props for the GenrePills component.
 */
interface GenrePillsProps {
  /** The genres to display */
  genres: Genre[];
}

/**
 * This component creates a row of genre pills.
 * @param {Genre[]} genres The genres to display
 */
const GenrePills = ({ genres }: GenrePillsProps) => {
  return (
    <div className="flex flex-wrap gap-1 mx-auto items-center justify-center">
      {genres.map((genre, index) => (
        <Link
          search={{ genres: genre.slug }}
          to={"/albums"}
          resetScroll={true}
          key={index}
          className="bg-neutral-900/80 text-gray-400 rounded-full px-2 py-1 text-sm hover:bg-neutral-900 hover:transform hover:-translate-y-1 hover:text-red-500 hover:underline transition-all duration-200 cursor-pointer"
          style={{ viewTransitionName: `genre-pill-${genre.slug}` }}
        >
          {genre.name}
        </Link>
      ))}
    </div>
  );
};

export default GenrePills;
