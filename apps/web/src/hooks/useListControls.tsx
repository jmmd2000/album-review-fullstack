import { PAGE_SIZE } from "@shared/constants";

interface ListData {
  /** Total rows across all pages */
  totalCount: number;
  /** Whether another page exists after the current one */
  furtherPages: boolean;
}

interface UseListControlsArgs<TSearch extends { page?: number; search?: string }> {
  /** The current page from the route's search params */
  page: number | undefined;
  /** The totals from the list payload */
  data: ListData;
  /** The route's navigate, kept typed through the generic */
  navigate: (options: { search: (prev: TSearch) => TSearch }) => void;
}

/**
 * The url-backed controls every paginated list page shares, the search
 * handler and the pagination block, shaped for CardGrid's controls prop.
 */
export function useListControls<TSearch extends { page?: number; search?: string }>({ page, data, navigate }: UseListControlsArgs<TSearch>) {
  const search = (value: string) => {
    navigate({ search: prev => ({ ...prev, search: value, page: undefined }) });
  };

  const pagination = {
    next: {
      action: () => {
        if (data.furtherPages) {
          navigate({ search: prev => ({ ...prev, page: (prev.page || 1) + 1 }) });
        }
      },
      disabled: !data.furtherPages,
    },
    prev: {
      action: () => {
        navigate({
          search: prev => {
            const currentPage = prev.page || 1;
            if (currentPage > 1) {
              return { ...prev, page: currentPage - 1 };
            }
            return prev;
          },
        });
      },
      disabled: page === 1 || page === undefined,
    },
    page: {
      pageNumber: page || 1,
      totalPages: Math.ceil(data.totalCount / PAGE_SIZE),
      totalCount: data.totalCount,
      pageSize: PAGE_SIZE,
    },
  };

  return { search, pagination };
}
