import { Route } from "@/routes/__root";
import { GetPaginatedAlbumsOptions } from "@shared/types";
import { motion } from "framer-motion";
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

  return (
    <div className="relative w-full">
      <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer text-sm text-gray-800" onClick={() => setIsOpen(!isOpen)}>
        {selectedItems.length > 0 ? selectedItems.map((item) => item.name).join(", ") : "Select option(s)"}
      </div>
      <motion.ul
        ref={dropdownRef}
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : -10,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        transition={{ duration: 0.1 }}
        className="absolute mt-1 min-w-max bg-white border border-gray-300 rounded-md shadow-lg overflow-auto max-h-60 z-10"
      >
        {items.length > 0 ? (
          items.map(({ name, value }) => {
            const isSelected = selectedItems.some((i) => i.value === value);
            return (
              <li key={value} className={`px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 ${isSelected ? "bg-gray-200 font-semibold" : ""}`} onClick={() => toggleSelect({ name, value })}>
                <input
                  type="checkbox"
                  readOnly
                  checked={isSelected}
                  className="w-4 h-4 appearance-none bg-zinc-800 border-2 border-zinc-600 rounded cursor-pointer
             checked:bg-green-500 checked:border-green-700
             focus:ring-green-400 focus:ring-2 mr-2 align-middle"
                />
                {name}
              </li>
            );
          })
        ) : (
          <li className="px-4 py-2 text-sm text-gray-500 italic">No items found.</li>
        )}
      </motion.ul>
    </div>
  );
};

// export const Dropdown = ({ items, isOpen, onSelect, dropdownRef }: DropdownProps) => (
//   console.log("Dropdown items:", items),
//   (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.ul
//           ref={dropdownRef}
//           initial={{ opacity: 0, y: -5 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -5 }}
//           transition={{ duration: 0.1 }}
//           className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-auto max-h-60 z-10"
//         >
//           {items.length > 0 ? (
//             items.map(({ name, value }) => (
//               <li key={value} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700" onClick={() => onSelect(value)}>
//                 {name}
//               </li>
//             ))
//           ) : (
//             <li className="px-4 py-2 text-sm text-gray-500 italic">No items found.</li>
//           )}
//         </motion.ul>
//       )}
//     </AnimatePresence>
//   )
// );
