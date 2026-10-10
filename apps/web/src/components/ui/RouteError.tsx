import type { ReactNode } from "react";
import { ApiError } from "@/lib/client";
import { PageState } from "@/components/ui/PageState";
import { NotFound } from "@/components/layout/NotFound";
import { Button } from "@/components/ui/Button";

interface RouteErrorProps {
  /** Whatever the route threw. An ApiError with status 404 shows the not found page. */
  error: unknown;
  reset: () => void;
  /** A way back, such as a link to the albums */
  children?: ReactNode;
}

/**
 * Error UI for a route's errorComponent. A loader turns an API 404 into the route's not found page with notFoundOn404,
 * so a 404 only gets here when a page's data goes missing after it loaded.
 */
export function RouteError({ error, reset, children }: RouteErrorProps) {
  if (error instanceof ApiError && error.status === 404) return <NotFound>{children}</NotFound>;

  return (
    <PageState role="alert" title="Something went wrong" detail="This page could not be loaded. You can try again, or head back.">
      <Button type="button" variant="primary" onClick={reset}>
        Try again
      </Button>
      {children}
    </PageState>
  );
}
