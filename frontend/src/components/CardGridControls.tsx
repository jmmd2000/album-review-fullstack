import Button from "@components/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SortDropdown, { SortDropdownProps } from "@components/SortDropdown";
interface CardGridControlsProps {
  /** Indicates if pagination is disabled or not */
  pagination: boolean;
  /** Next page action and disabled state */
  nextPage?: { action: () => void; disabled?: boolean };
  /** Previous page action and disabled state */
  previousPage?: { action: () => void; disabled?: boolean };
  /** Current page number and total pages */
  pageData?: { pageNumber: number; totalPages: number };
  /** Options for the sorting dropdown */
  sortSettings?: SortDropdownProps;
  /** Search callback function */
  search?: (search: string) => void;
}

/**
 * This component creates a card grid with controls for pagination and search.
 */
const CardGridControls = ({ pagination, nextPage, previousPage, pageData, search, sortSettings }: CardGridControlsProps) => {
  return (
    <div className="sticky top-0 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 z-10">
      <div className="flex gap-3 max-w-[1900px] mx-4 backdrop-blur-sm px-2 py-4 z-10">
        {search && (
          <div className="flex justify-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="rounded-sm py-2 bg-neutral-800 px-4"
              id="search-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const inputElement = e.target as HTMLInputElement;
                  const inputValue = inputElement?.value || "";
                  search(inputValue);
                }
              }}
            />
            <Button
              label={"Search"}
              onClick={() => {
                const inputElement = document.getElementById("search-input") as HTMLInputElement;
                const inputValue = inputElement?.value || "";
                search(inputValue);
              }}
            />
            {sortSettings && <SortDropdown {...sortSettings} />}
          </div>
        )}

        {pagination && nextPage && previousPage && (
          <div className="ml-auto flex justify-center items-center gap-2">
            <Button label={<ChevronLeft />} onClick={previousPage.action} disabled={previousPage.disabled} />
            <div className="border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded" aria-label="Page Number">
              {pageData?.pageNumber} / {pageData?.totalPages}
            </div>
            <Button label={<ChevronRight />} onClick={nextPage.action} disabled={nextPage.disabled} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGridControls;
