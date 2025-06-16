import { Route } from "@/routes/__root";
import { GetPaginatedAlbumsOptions } from "@shared/types";
import { AnimatePresence, motion } from "framer-motion";
import { RefObject, useEffect, useState } from "react";

export interface DropdownProps {
  /** Array of items with display name and actual value */
  items: { name: string; value: string }[];
  /** Whether the dropdown is visible */
  isOpen: boolean;
  /** Callback to set isOpen */
  setIsOpen: (isOpen: boolean) => void;
  /** Callback with the selected item's value */
  onSelect: (value: string[]) => void;
  /** Ref to the dropdown UL element for click-outside handling */
  dropdownRef: RefObject<HTMLUListElement | null>;
}

export const Dropdown = ({ items, isOpen, setIsOpen, onSelect, dropdownRef }: DropdownProps) => {
  const [selectedItems, setSelectedItems] = useState<{ name: string; value: string }[]>([]);
  const options: GetPaginatedAlbumsOptions = Route.useSearch();

  useEffect(() => {
    const rawGenres = options.genres as string | undefined;
    const genreList = rawGenres?.split(",").filter(Boolean) ?? [];
    const preselected = items.filter((item) => genreList.includes(item.value));
    setSelectedItems(preselected);
  }, [options.genres, items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownRef, setIsOpen]);

  const toggleSelect = (item: { name: string; value: string }) => {
    const exists = selectedItems.find((i) => i.value === item.value);
    const updated = exists ? selectedItems.filter((i) => i.value !== item.value) : [...selectedItems, item];
    setSelectedItems(updated);
    onSelect(updated.map((i) => i.value));
  };

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
      },
    }),
  };

  return (
    <div className="relative w-full">
      <motion.div
        className="max-w-[10rem] sm:max-w-[20rem] w-full px-4 py-2.5 bg-neutral-800 border border-transparent hover:bg-neutral-900 hover:border-neutral-800 rounded-md shadow-sm cursor-pointer h-11 text-white overflow-hidden whitespace-nowrap text-ellipsis"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
      >
        {selectedItems.length > 0 ? selectedItems.map((item) => item.name).join(", ") : "Select option(s)"}
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={dropdownRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute mt-1 min-w-max bg-neutral-800 text-white border border-neutral-800 rounded-md shadow-lg overflow-x-hidden max-h-60 z-100"
          >
            {items.map(({ name, value }, index) => {
              const isSelected = selectedItems.some((i) => i.value === value);
              return (
                <motion.li
                  key={value}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  custom={index}
                  className={`px-4 py-2 cursor-pointer text-sm hover:bg-neutral-800 hover:text-red-500 transition-transform overflow-hidden ${isSelected ? "bg-neutral-800 text-red-500" : ""}`}
                  onClick={() => toggleSelect({ name, value })}
                  whileHover={{
                    x: 3,
                    transition: { duration: 0.1 },
                  }}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={isSelected}
                    className="w-4 h-4 appearance-none bg-zinc-800 border-2 border-zinc-600 rounded cursor-pointer
                checked:bg-green-500 checked:border-green-700
                focus:ring-green-400 focus:ring-2 mr-2 align-middle"
                  />
                  {name}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
