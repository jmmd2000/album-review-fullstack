import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";

interface ListPageLayoutProps {
  /** Keys the animation so page changes replay the entrance */
  page?: number;
  children: ReactNode;
}

/** The entrance wrapper every paginated list page shares. */
export const ListPageLayout = ({ page, children }: ListPageLayoutProps) => {
  const hydrated = useHydrated();
  return (
    <motion.div key={page} initial={hydrated ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
};
