interface SkeletonProps {
  /** Grid mimics a card list page, detail mimics a heading page */
  variant: "grid" | "detail";
}

/**
 * The shared loading placeholder. Pulsing blocks shaped like the page that is
 * coming, so pending routes and auth checks all look the same while they wait.
 */
export const Skeleton = ({ variant }: SkeletonProps) => {
  if (variant === "grid") {
    return (
      <div data-testid="skeleton-grid" className="animate-pulse">
        <div className="flex gap-3 max-w-475 3xl:max-w-600 4xl:max-w-750 mx-4 px-2 py-4">
          <div className="h-11 w-64 rounded-sm bg-neutral-800" />
          <div className="h-11 w-24 rounded bg-neutral-800" />
          <div className="h-11 w-44 rounded-sm bg-neutral-800" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 3xl:gap-6 max-w-475 3xl:max-w-600 4xl:max-w-750 mx-auto my-8 px-4">
          {Array.from({ length: 14 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="w-full aspect-square rounded-lg bg-neutral-800" />
              <div className="h-4 w-3/4 rounded bg-neutral-800" />
              <div className="h-3 w-1/2 rounded bg-neutral-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="skeleton-detail" className="animate-pulse container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="h-9 w-64 rounded bg-neutral-800 mb-6" />
      <div className="flex flex-col gap-3 max-w-3xl">
        <div className="h-4 w-full rounded bg-neutral-800" />
        <div className="h-4 w-5/6 rounded bg-neutral-800" />
        <div className="h-4 w-2/3 rounded bg-neutral-800" />
      </div>
    </div>
  );
};
