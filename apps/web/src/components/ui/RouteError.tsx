import type { ReactNode } from "react";
import { ApiError } from "@/lib/client";
import { PageState } from "@/components/ui/PageState";
import { Button } from "@/components/ui/Button";

interface RouteErrorProps {
  error: Error;
  reset: () => void;
  notFoundTitle?: string;
  notFoundDetail?: string;
  children?: ReactNode;
}

/**
 * Error UI for a route's errorComponent.
 */
export function RouteError({ error, reset, notFoundTitle = "Not found", notFoundDetail = "This page does not exist, or the link may be wrong.", children }: RouteErrorProps) {
  const apiError = error instanceof ApiError ? error : null;
  const notFound = apiError?.status === 404;
  const marker = apiError ? String(apiError.status) : "Error";

  return (
    <PageState
      role="alert"
      marker={marker}
      title={notFound ? notFoundTitle : "Something went wrong"}
      detail={notFound ? notFoundDetail : "This page could not be loaded. You can try again, or head back."}
    >
      {!notFound && (
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      )}
      {children}
    </PageState>
  );
}
