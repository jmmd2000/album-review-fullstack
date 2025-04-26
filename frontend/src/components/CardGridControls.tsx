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
import { useRef } from "react";

const CardGridControls = ({ pagination, nextPage, previousPage, pageData, search, sortSettings }: CardGridControlsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="sticky top-0 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 z-10">
      <div className="flex flex-col sm:flex-row gap-3 max-w-[1900px] mx-4 backdrop-blur-sm px-2 py-4 z-10">
        {search && (
          <div className="flex flex-col sm:flex-row justify-center gap-2 w-full sm:w-auto">
            <div className="flex flex-row justify-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                ref={inputRef}
                className="w-[75%] sm:w-auto rounded-sm py-2 bg-neutral-800 px-4"
                onKeyDown={(e) => {
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
            <div className="flex flex-row justify-center gap-2 w-full sm:w-auto">
              {sortSettings && <SortDropdown {...sortSettings} />}
              {pagination && nextPage && previousPage && (
                <div className="flex flex-row justify-center items-center gap-2 ml-auto w-full sm:hidden">
                  <Button label={<ChevronLeft />} onClick={previousPage.action} disabled={previousPage.disabled} size="icon" />
                  <div aria-label="Page Number" className="border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded">
                    {pageData?.pageNumber} / {pageData?.totalPages}
                  </div>
                  <Button label={<ChevronRight />} onClick={nextPage.action} disabled={nextPage.disabled} size="icon" />
                </div>
              )}
            </div>
          </div>
        )}

        {pagination && nextPage && previousPage && (
          <div className=" flex-row justify-center items-center gap-2 mt-4 sm:mt-0 ml-auto w-full hidden sm:w-auto sm:flex">
            <Button label={<ChevronLeft />} onClick={previousPage.action} disabled={previousPage.disabled} size="icon" />
            <div aria-label="Page Number" className="border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded">
              {pageData?.pageNumber} / {pageData?.totalPages}
            </div>
            <Button label={<ChevronRight />} onClick={nextPage.action} disabled={nextPage.disabled} size="icon" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGridControls;
