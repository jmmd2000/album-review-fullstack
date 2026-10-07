import { useAuth } from "@/auth/useAuth";
import { PageState } from "@/components/ui/PageState";

import type { ReactNode } from "react";

interface AdminOnlyProps {
  children: ReactNode;
}

/** Shows its children only to admin. Visitors get a note to log in, and nothing shows while the login is checked. */
export function AdminOnly({ children }: AdminOnlyProps) {
  const { isAdmin, isPending } = useAuth();

  if (isPending) return null;
  if (!isAdmin) return <PageState title="Log in to see this page" detail="Use the lock at the top of the page." />;
  return children;
}
