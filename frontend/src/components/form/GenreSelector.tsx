import { useEffect, useRef, useState } from "react";
import {
  UseFormRegister,
  UseFieldArrayRemove,
  UseFieldArrayAppend,
  UseFormSetValue,
} from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Genre } from "@shared/types";
import { CreateReviewFormData } from "./AlbumReviewForm";

interface GenreSelectorProps {
  genreFields: Array<{ id: string; name: string }>;
  register: UseFormRegister<CreateReviewFormData>;
  removeGenre: UseFieldArrayRemove;
  addGenre: UseFieldArrayAppend<CreateReviewFormData, "genres">;
  setValue: UseFormSetValue<CreateReviewFormData>;
  genres: Genre[];
}

const GenreSelector = ({
  genreFields,
  register,
  removeGenre,
  addGenre,
  setValue,
  genres,
}: GenreSelectorProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filtered = genres.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const handleSelect = (genre: string) => {
    const lastIdx = genreFields.length - 1;
    if (genreFields[lastIdx]?.name === "") {
      setValue(`genres.${lastIdx}.name`, genre);
    } else {
      addGenre({ name: genre });
    }
    setIsDropdownOpen(false);
    setSearchTerm("");
  };
  const handleAdd = () => {
    setSearchTerm("");
    addGenre({ name: "" });
    setIsDropdownOpen(true);
  };
  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-neutral-800">
      <label className="block text-zinc-200 font-medium mb-3">Genres</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {genreFields.map((field, idx) => {
          const isLast = idx === genreFields.length - 1;
          return (
            <div
              key={field.id}
              className="relative group bg-neutral-700/50 rounded-full pl-3 pr-8 py-1.5 text-sm"
              ref={isLast ? dropdownRef : undefined}
            >
              <input
                {...register(`genres.${idx}.name`)}
                defaultValue={field.name}
                className="bg-transparent text-zinc-200 focus:outline-none w-full"
                placeholder="Enter genre"
                autoComplete="off"
                onChange={e => {
                  if (isLast) {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setValue(`genres.${idx}.name`, e.target.value);
                  }
                }}
                onFocus={() => {
                  if (isLast) setIsDropdownOpen(true);
                }}
              />
              <button
                type="button"
                onClick={() => removeGenre(idx)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
              {isLast && (
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {filtered.length > 0 ? (
                          filtered.map(g => (
                            <div
                              key={g.slug}
                              className="px-3 py-2 hover:bg-neutral-700 cursor-pointer text-zinc-200 text-sm"
                              onClick={() => handleSelect(g.name)}
                            >
                              {g.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-neutral-400 text-sm italic">
                            No matching genres.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleAdd}
          className="bg-neutral-700/30 hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 rounded-full px-3 py-1.5 text-sm flex items-center"
        >
          <span className="mr-1">+</span> Add Genre
        </button>
      </div>
    </div>
  );
};

export default GenreSelector;
