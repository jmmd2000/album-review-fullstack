import Button from "@components/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SortDropdown, { SortDropdownProps } from "@components/SortDropdown";
interface PaginationControls {
  next: { action: () => void; disabled?: boolean };
  prev: { action: () => void; disabled?: boolean };
  page: { pageNumber: number; totalPages: number };
}

export interface DropdownControlsProps {
  items: { name: string; value: string }[];
  // isOpen: boolean;
  // setIsOpen: (isOpen: boolean) => void;
  onSelect: (value: string[]) => void;
}

interface CardGridControlsProps {
  /** Callback for search bar */
  search?: (search: string) => void;
  /** Pagination controls */
  pagination?: PaginationControls;
  /** Options for the sorting dropdown */
  sortSettings?: SortDropdownProps;
  /** Secondary sort settings (only shown when primary sort is "Year") */
  secondarySortSettings?: SortDropdownProps;
  /** Genre dropdown filter settings */
  genreSettings?: DropdownControlsProps;
}

/**
 * This component creates a card grid with controls for pagination and search.
 */
import { useRef, useState } from "react";
import { Dropdown } from "./Dropdown";

const CardGridControls = ({
  pagination,
  search,
  sortSettings,
  secondarySortSettings,
  genreSettings,
}: CardGridControlsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const onSelect = (value: string[]) => {
    if (genreSettings?.onSelect) {
      genreSettings.onSelect(value);
    }
    setDropdownOpen(false);
  };

  return (
    <div className="sticky top-0 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 z-10">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 max-w-[1900px] mx-4 backdrop-blur-sm px-2 py-4 z-10">
        {search && (
          <div className="flex flex-col sm:flex-row justify-center gap-2 w-full sm:w-auto">
            <div className="flex flex-row justify-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                ref={inputRef}
                className="w-[75%] sm:w-auto rounded-sm py-2 bg-neutral-800 h-11 px-4"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const val = inputRef.current?.value || "";
                    search(val);
                  }
                }}
              />
              <Button
                label="Search"
                onClick={() => {
                  search(inputRef.current?.value || "");
                }}
                size="compact"
              />
            </div>
            <div className="flex flex-row flex-nowrap justify-center gap-2 w-full sm:w-auto min-w-0">
              {sortSettings && <SortDropdown {...sortSettings} />}
              {secondarySortSettings && (
                <SortDropdown {...secondarySortSettings} />
              )}
              {genreSettings && (
                <Dropdown
                  items={genreSettings!.items}
                  dropdownRef={dropdownRef}
                  isOpen={dropdownOpen}
                  setIsOpen={setDropdownOpen}
                  onSelect={onSelect}
                  multiple
                />
              )}
            </div>
          </div>
        )}

        {pagination && (
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
            <Button
              label={<ChevronLeft />}
              onClick={pagination.prev.action}
              disabled={pagination.prev.disabled}
              size="icon"
            />
            <div className="border border-transparent bg-neutral-800 transition-colors text-neutral-200 text-sm font-medium py-2 px-4 rounded text-center h-11 flex items-center">
              {pagination.page.pageNumber} / {pagination.page.totalPages}
            </div>
            <Button
              label={<ChevronRight />}
              onClick={pagination.next.action}
              disabled={pagination.next.disabled}
              size="icon"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGridControls;
