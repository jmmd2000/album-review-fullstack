import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ListPageLayoutProps {
  /** Keys the animation so page changes replay the entrance */
  page?: number;
  children: ReactNode;
}

/** The entrance wrapper every paginated list page shares. */
export const ListPageLayout = ({ page, children }: ListPageLayoutProps) => (
  <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    {children}
  </motion.div>
);
