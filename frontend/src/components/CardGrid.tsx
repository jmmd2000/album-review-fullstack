import CardGridControls from "@/components/CardGridControls";

interface CardGridProps {
  /** The cards to display in the grid */
  cards: React.ReactNode[];
  /** The width of each card, including the unit */
  cardWidth?: string;
  /** Options object to include certain features */
  options?: {
    controls?: boolean;
    counter?: boolean;
  };
  /** Function to go to the next page */
  nextPage: () => void;
  /** Function to go to the previous page */
  previousPage: () => void;

  nextDisabled?: boolean;
  previousDisabled?: boolean;
}

const CardGrid = ({ cards, options, nextPage, previousPage, nextDisabled, previousDisabled }: CardGridProps) => {
  return (
    <>
      {options?.controls && <CardGridControls nextPage={nextPage} previousPage={previousPage} nextDisabled={nextDisabled} previousDisabled={previousDisabled} />}
      <div className={`grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-w-[1900px] mx-4 my-8 gap-4 place-items-center`}>
        {cards.map((card, index) => (
          <div key={index}>{card}</div>
        ))}
      </div>
    </>
  );
};

export default CardGrid;
