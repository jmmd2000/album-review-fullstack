import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * The props for the Dialog component.
 */
interface DialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Optional title to display in the dialog header */
  title?: string;
  /** The content of the dialog */
  children: React.ReactNode;
}

/**
 * A generic dialog/modal component using Framer Motion for animations.
 *
 * @param {boolean} isOpen - Whether the dialog is shown
 * @param {() => void} onClose - Function to call to close the dialog
 * @param {string} [title] - Optional header title
 * @param {React.ReactNode} children - Dialog body content
 */
const Dialog = ({ isOpen, onClose, title, children }: DialogProps) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop layers */}
        <motion.div className="fixed inset-0 bg-black/90 z-49" style={{ backdropFilter: "blur(20px) saturate(180%)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="fixed inset-0 bg-transparentz-101" style={{ backdropFilter: "blur(12px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

        {/* Centered modal container */}
        <motion.div className="fixed inset-0 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="bg-gradient-to-br from-neutral-800/95 to-neutral-900/95 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden backdrop-blur-[256px] border border-neutral-700/50"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              transition: { type: "spring", damping: 25, stiffness: 300, delay: 0.1 },
            }}
            exit={{ scale: 0.9, y: 20, opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Header: title + close */}
            <div className="flex justify-between items-center border-b border-neutral-700/50 p-4">
              {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
              <motion.button onClick={onClose} className="text-gray-400 hover:text-red-600" whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Body */}
            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default Dialog;
