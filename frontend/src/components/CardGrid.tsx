import CardGridControls from "@/components/CardGridControls";
import { motion } from "framer-motion";
import { SortDropdownProps } from "@components/SortDropdown";

interface CardGridProps {
  /** The cards to display in the grid */
  cards: React.ReactNode[];
  /** The width of each card, including the unit */
  cardWidth?: string;
  /** Options object to include certain features */
  options?: {
    search?: boolean;
    pagination?: boolean;
    counter?: number;
    heading?: string;
  };
  /** Search callback function */
  search?: (search: string) => void;
  /** Pagination control for next page */
  nextPage?: {
    action: () => void;
    disabled?: boolean;
  };
  /** Pagination control for previous page */
  previousPage?: {
    action: () => void;
    disabled?: boolean;
  };
  /** The current page number and total pages */
  pageData?: {
    pageNumber: number;
    totalPages: number;
  };
  /** Options for the sorting dropdown */
  sortSettings?: SortDropdownProps;
}

/**
 * Animation variants for the card grid container.
 * This is used to animate the grid when it is displayed.
 * The staggerChildren property is used to create a staggered effect for the child elements.
 */
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.02,
    },
  },
};

/**
 * Animation variants for each card item in the grid.
 * This is used to animate the cards when they are displayed.
 */
const itemVariants = {
  hidden: { y: 20 },
  show: { y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/**
 * This component creates a card grid with controls for pagination and search.
 */
const CardGrid = ({ cards, options, nextPage, previousPage, pageData, search, sortSettings }: CardGridProps) => {
  const shouldShowControls = options?.search || options?.pagination;

  return (
    <>
      {shouldShowControls && options?.pagination && nextPage && previousPage && pageData && search ? (
        <CardGridControls pagination={true} nextPage={nextPage} previousPage={previousPage} pageData={pageData} search={search} sortSettings={sortSettings} />
      ) : shouldShowControls && search ? (
        <CardGridControls search={search} pagination={false} />
      ) : null}

      {options?.heading && (
        <div className="max-w-[1900px] mx-4 px-2 pt-4 z-10">
          <h2 className="text-xl font-medium text-neutral-200 text-left">{options.heading}</h2>
        </div>
      )}

      {options?.counter && (
        <div className="flex justify-start items-center gap-2 max-w-[1900px] mx-4 px-2 z-10">
          <p className="text-sm text-neutral-400">{`Showing ${options.counter} results`}</p>
        </div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 max-w-[1900px] mx-auto my-8 px-4">
        {cards.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            {card}
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

export default CardGrid;
