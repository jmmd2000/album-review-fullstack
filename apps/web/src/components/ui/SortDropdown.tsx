import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { easeIn, easeOut } from "framer-motion";

interface SortOption {
  label: string;
  value: string;
}
/** Options for the sorting dropdown */
export interface SortDropdownProps {
  /** The label and value for each option */
  options: SortOption[];
  /** Callback function to handle sort changes */
  onSortChange: (value: string, direction: "asc" | "desc") => void;
  /** The current sort value, read from the URL by the page */
  value?: string;
  /** The current sort direction, read from the URL by the page */
  direction?: "asc" | "desc";
}

/**
 * A controlled dropdown for sorting options. The page owns the state through
 * the URL, this only reports changes, so back and forward move it too.
 */
export default function SortDropdown({ options, onSortChange, value, direction = "desc" }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = value ? options.find(option => option.value === value) || null : null;
  const sortDirection = direction;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionSelect = (option: SortOption) => {
    setIsOpen(false);
    onSortChange(option.value, sortDirection);
  };

  const toggleSortDirection = () => {
    if (selectedOption) {
      onSortChange(selectedOption.value, sortDirection === "asc" ? "desc" : "asc");
    }
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
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: easeIn,
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
    <div className="relative" ref={dropdownRef}>
      <motion.div
        className="flex items-center h-11 justify-between w-44 md:w-48 rounded-sm py-2 bg-neutral-800 px-4 cursor-pointer border border-transparent hover:bg-neutral-900 hover:border-neutral-800"
        onClick={toggleDropdown}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex-1 truncate">{selectedOption ? selectedOption.label : "Sort by..."}</div>
        <div className="flex items-center">
          {selectedOption && (
            <motion.button
              onClick={e => {
                e.stopPropagation();
                toggleSortDirection();
              }}
              className="p-1 mr-1 rounded-full hover:bg-neutral-900 cursor-pointer"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(38, 38, 38, 0.8)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={sortDirection}
                  initial={{
                    opacity: 0,
                    y: sortDirection === "asc" ? 10 : -10,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: sortDirection === "asc" ? -10 : 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {sortDirection === "asc" ? <ArrowUp className="w-4 h-4 text-red-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 200 }}>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute z-10 w-full mt-1 bg-neutral-900 rounded-md shadow-lg overflow-hidden" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
            <ul className="border rounded-md border-neutral-800">
              {options.map((option, index) => (
                <motion.li
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer hover:bg-neutral-800 hover:text-red-500 hover:font-semibold transition overflow-hidden ${selectedOption?.value === option.value ? "bg-neutral-800 text-red-500 font-semibold" : ""} 
                  ${index === 0 ? "rounded-t-md" : index === options.length - 1 ? "rounded-b-md" : ""}`}
                  onClick={() => handleOptionSelect(option)}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  whileHover={{
                    x: 3,
                    transition: { duration: 0.1 },
                  }}
                >
                  {option.label}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
