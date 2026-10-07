interface UseListControlsArgs<TSearch extends { page?: number; search?: string }> {
  /** The route's navigate, kept typed through the generic */
  navigate: (options: { search: (prev: TSearch) => TSearch }) => Promise<void>;
}

/**
 * The url-backed search every paginated list page shares. A new search starts again from page one, and an empty one removes the param.
 */
export function useListControls<TSearch extends { page?: number; search?: string }>({ navigate }: UseListControlsArgs<TSearch>) {
  const search = (value: string) => {
    void navigate({ search: prev => ({ ...prev, search: value === "" ? undefined : value, page: undefined }) });
  };

  return { search };
}
