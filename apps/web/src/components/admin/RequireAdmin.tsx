import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "@/auth/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Wrap any page/component that should be admin-only.
 * Redirects to "/" if not authenticated.
 */
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !isAdmin) {
      navigate({ to: "/" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isPending]);

  // A skeleton while auth resolves, so admin pages stop flashing blank
  if (isPending) return <Skeleton variant="detail" />;
  if (!isAdmin) return null;
  return <>{children}</>;
};
