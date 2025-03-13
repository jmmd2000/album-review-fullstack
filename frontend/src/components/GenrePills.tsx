interface GenrePillsProps {
  genres: string[];
}

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
