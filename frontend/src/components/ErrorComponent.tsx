import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter, ErrorComponentProps, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * This component is displayed when an error occurs in the app.
 * @param {ErrorComponentProps} props The props for the ErrorComponent.
 */
const ErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const params = useParams({ strict: false });
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  // Check if the error message matches "album already exists"
  const isAlbumExistsError = error.message.toLowerCase().includes("album already exists");

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="flex flex-col items-center justify-center gap-4 p-5 border-2 text-red-500 bg-red-500/40 border-red-500 w-[400px] rounded-lg">
        <h1 className="text-3xl font-bold">Error</h1>
        <p>{error.message}</p>

        {isAlbumExistsError ? (
          <div className="flex gap-4">
            {/* Suggest redirecting to edit instead */}
            <button
              onClick={() =>
                router.navigate({
                  to: "/albums/$albumID/edit",
                  replace: true,
                  params: { albumID: params.albumID ?? "" },
                })
              }
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Edit the album instead
            </button>
            <button onClick={() => router.invalidate()} className="px-4 py-2 bg-blue-400 text-white rounded">
              Retry
            </button>
          </div>
        ) : (
          <button onClick={() => router.invalidate()} className="px-4 py-2 bg-blue-400 text-white rounded">
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorComponent;
