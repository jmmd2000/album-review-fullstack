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
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <PageState role="alert" title={notFound ? notFoundTitle : "Something went wrong"} detail={notFound ? notFoundDetail : "This page could not be loaded. You can try again, or head back."}>
      {!notFound && (
        <Button type="button" variant="primary" onClick={reset}>
          Try again
        </Button>
      )}
      {children}
    </PageState>
  );
}
