import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { useEffect, useState } from "react";

export interface DropdownProps {
  items: { name: string; value: string }[];
  /** The currently selected values, owned by whoever renders the dropdown */
  selected: string[];
  /** Shown on the trigger when nothing is selected in single mode */
  placeholder?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSelect: (value: string[]) => void;
  dropdownRef: RefObject<HTMLUListElement | null>;
  multiple?: boolean;
}

/**
 * A controlled dropdown. The parent owns the selection (usually through its
 * route's search params) and this only reports changes, so it works on any
 * page without knowing where the state lives.
 */
export const Dropdown = ({ items, selected, placeholder, isOpen, setIsOpen, onSelect, dropdownRef, multiple = false }: DropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const selectedItems = items.filter(item => selected.includes(item.value));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownRef, setIsOpen]);

  const handleSelect = (item: { name: string; value: string }) => {
    if (multiple) {
      const exists = selected.includes(item.value);
      onSelect(exists ? selected.filter(value => value !== item.value) : [...selected, item.value]);
    } else {
      onSelect([item.value]);
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };
  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.2 } }),
  };

  return (
    <div className="relative w-full overflow-visible">
      {/* trigger */}
      <motion.div
        className="w-full px-4 py-2.5 bg-neutral-800 border border-transparent hover:bg-neutral-900 hover:border-neutral-800 rounded-md shadow-sm cursor-pointer h-11 text-white overflow-hidden whitespace-nowrap text-ellipsis"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
      >
        {multiple ? (selectedItems.length > 0 ? selectedItems.map(i => i.name).join(", ") : "Select option(s)") : (selectedItems[0]?.name ?? placeholder ?? "Select an option")}
      </motion.div>

      {/* dropdown list */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={dropdownRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute mt-1 min-w-max bg-neutral-800 text-white border border-neutral-800 rounded-md shadow-lg overflow-x-hidden overflow-y-auto max-h-60 z-9999"
          >
            {/* filter input */}
            <li className="px-4 py-2">
              <input
                type="text"
                className="w-full bg-neutral-700 text-white placeholder-gray-400 rounded px-2 py-1 focus:outline-none"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </li>
            {/* items */}
            {items
              .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item, idx) => {
                const isSel = selected.includes(item.value);
                return (
                  <motion.li
                    key={item.value}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={idx}
                    className={`px-4 py-2 cursor-pointer text-sm hover:bg-neutral-700 ${isSel ? "bg-neutral-700 text-red-500 font-semibold" : ""} flex items-center`}
                    onClick={() => handleSelect(item)}
                    whileHover={{ x: 3, transition: { duration: 0.1 } }}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={isSel}
                        readOnly
                        className="w-4 h-4 appearance-none bg-zinc-800 border-2 border-zinc-600 rounded cursor-pointer checked:bg-green-500 checked:border-green-700 focus:ring-green-400 focus:ring-2 mr-2 align-middle"
                      />
                    )}
                    {item.name}
                  </motion.li>
                );
              })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
