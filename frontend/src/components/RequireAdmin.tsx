import { ReactNode, useEffect } from "react";
import { useAuth } from "@/auth/useAuth";
import { useNavigate } from "@tanstack/react-router";

/**
 * Wrap any page/component that should be admin-only.
 * Redirects to "/" if not authenticated.
 */
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) return null;
  return <>{children}</>;
};
