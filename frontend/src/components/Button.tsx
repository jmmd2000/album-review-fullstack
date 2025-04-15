import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type React from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ButtonProps {
  /** The label to display on the button */
  label: string | React.ReactNode;
  /** Function to call when the button is clicked */
  onClick?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** The type of the button */
  type?: "button" | "submit" | "reset";
  /** Loading, error and success states */
  states?: {
    loading?: boolean;
    error?: boolean;
    success?: boolean;
  };
}

/**
 * This component creates a button with a label and an optional click handler.
 */
const Button = ({ label, onClick, disabled, type, states }: ButtonProps) => {
  const { loading, error, success } = states || {};
  const [displayState, setDisplayState] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Handle state changes
  useEffect(() => {
    if (loading) {
      setDisplayState("loading");
    } else if (success) {
      setDisplayState("success");
      // Auto-reset success state after animation
      const timer = setTimeout(() => {
        setDisplayState("idle");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (error) {
      setDisplayState("error");
    } else {
      setDisplayState("idle");
    }
  }, [loading, success, error]);

  // Animation variants - keeping the original ones
  const buttonVariants = {
    initial: {
      scale: 1,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
    },
    hover: disabled
      ? {}
      : {
          scale: 1.02,
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        },
    disabled: {
      scale: 1,
      opacity: 0.7,
    },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded overflow-hidden ${
        disabled ? "cursor-not-allowed text-neutral-600 bg-neutral-800/30" : "hover:bg-neutral-900 hover:border-neutral-800 hover:text-neutral-100 cursor-pointer"
      }`}
      initial="initial"
      whileHover="hover"
      animate={disabled ? "disabled" : "initial"}
      variants={buttonVariants}
      type={type}
    >
      {/* State background overlays */}
      <AnimatePresence>
        {displayState === "success" && <motion.div className="absolute inset-0 bg-green-600 rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}

        {displayState === "error" && <motion.div className="absolute inset-0 bg-red-600 rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
      </AnimatePresence>

      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center h-5">
        {/* Loading spinner */}
        <AnimatePresence>
          {displayState === "loading" && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, ease: "linear" }}>
                <Loader2 className="w-5 h-5" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success icon */}
        <AnimatePresence>
          {displayState === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2 },
              }}
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error icon */}
        <AnimatePresence>
          {displayState === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: [0, -3, 3, -3, 3, 0],
                transition: {
                  scale: { type: "spring", stiffness: 400, damping: 15 },
                  x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2 },
              }}
            >
              <XCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default label */}
        <AnimatePresence>
          {displayState === "idle" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {typeof label === "string" ? <span>{label}</span> : label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

export default Button;
