/**
 * The props for the GenrePills component.
 */
interface GenrePillsProps {
  /** The genres to display */
  genres: string[];
}

/**
 * This component creates a row of genre pills.
 * @param {string[]} genres The genres to display
 */
const GenrePills = (props: GenrePillsProps) => {
  const { genres } = props;
  return (
    <div className="flex gap-1 mx-auto items-center justify-center">
      {genres.map((genre, index) => (
        <span key={index} className="bg-zinc-800/40 text-gray-400 rounded-full px-2 py-1 text-sm">
          {genre}
        </span>
      ))}
    </div>
  );
};

export default GenrePills;
