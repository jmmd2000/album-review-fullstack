"use client";

import type React from "react";

import CardGridControls, { type DropdownControlsProps } from "@components/ui/CardGridControls";
import { motion } from "framer-motion";
import { easeOut } from "framer-motion";
import type { SortDropdownProps } from "@components/ui/SortDropdown";

interface CardGridProps {
  /** The cards to display in the grid */
  cards: React.ReactNode[];
  /** Optional heading */
  heading?: string;
  /** Show a results counter */
  counter?: number;
  /** Whether the cards are currently sorted by year */
  sortedByYear?: boolean;
  /** Array of years corresponding to each card (when sortedByYear is true) */
  cardYears?: number[];
  /** Optional control configuration */
  controls?: {
    search?: (search: string) => void;
    pagination?: {
      next: { action: () => void; disabled?: boolean };
      prev: { action: () => void; disabled?: boolean };
      page: { pageNumber: number; totalPages: number };
    };
    sortSettings?: SortDropdownProps;
    secondarySortSettings?: SortDropdownProps;
    genreSettings?: DropdownControlsProps;
  };
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
  show: { y: 0, transition: { duration: 0.3, ease: easeOut } },
};

/**
 * This component creates a card grid with controls for pagination and search.
 */
const CardGrid = ({
  cards,
  heading,
  counter,
  sortedByYear,
  cardYears,
  controls,
}: CardGridProps) => {
  const shouldShowControls = controls?.search || controls?.pagination;

  const renderCards = () => {
    if (!sortedByYear || !cardYears || cardYears.length !== cards.length) {
      // normal grid rendering
      return cards.map((card, index) => (
        <motion.div key={index} variants={itemVariants} className="flex flex-col">
          {card}
        </motion.div>
      ));
    }

    // group cards by year and render with dividers
    const groupedCards: React.ReactNode[] = [];
    let currentYear: number | null = null;

    cards.forEach((card, index) => {
      const year = cardYears[index];

      // Add year divider if new year
      if (currentYear !== year) {
        if (currentYear !== null) {
          // spacing before the new year divider
          groupedCards.push(<div key={`spacer-${year}`} className="col-span-full h-4" />);
        }

        groupedCards.push(
          <div key={`year-${year}`} className="col-span-full flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-700"></div>
            <span className="text-lg font-medium text-neutral-300 px-4">{year}</span>
            <div className="flex-1 h-px bg-neutral-700"></div>
          </div>
        );
        currentYear = year;
      }

      // add card
      groupedCards.push(
        <motion.div key={`card-${index}`} variants={itemVariants} className="flex flex-col">
          {card}
        </motion.div>
      );
    });

    return groupedCards;
  };

  return (
    <>
      {shouldShowControls && controls && (
        <CardGridControls
          search={controls.search}
          pagination={controls.pagination}
          sortSettings={controls.sortSettings}
          secondarySortSettings={controls.secondarySortSettings}
          genreSettings={controls.genreSettings}
        />
      )}

      {heading && (
        <div className="max-w-[1900px] mx-4 px-2 pt-4 z-10">
          <h2 className="text-xl font-medium text-neutral-200 text-left">{heading}</h2>
        </div>
      )}

      {typeof counter === "number" && (
        <div className="flex justify-start items-center gap-2 max-w-[1900px] mx-4 px-2 z-10">
          <p className="text-sm text-neutral-400">{`Showing ${counter} results`}</p>
        </div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 max-w-[1900px] mx-auto my-8 px-4"
        data-testid="album-grid"
      >
        {cards.length > 0 ? (
          renderCards()
        ) : (
          <div className="col-span-full text-center text-neutral-500">
            <p>No results found.</p>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default CardGrid;
