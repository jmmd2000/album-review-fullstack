import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import React from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ButtonProps {
  /** The label to display on the button */
  label: string | React.ReactNode;
  /** Function to call when the button is clicked */
  onClick?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** The type of the button */
  type?: "button" | "submit" | "reset";
  /** Optional loading, error and success states */
  states?: {
    loading?: boolean;
    error?: boolean;
    success?: boolean;
  };
  /** State messages for toasts */
  stateMessages?: {
    loading?: string;
    error?: string;
    success?: string;
  };
  /** Button size variant */
  size?: "default" | "compact" | "icon";
}

/**
 * This component creates a button with a label and an optional click handler.
 */
const Button = ({ label, onClick, disabled, type, states, stateMessages, size = "default" }: ButtonProps) => {
  const { loading, error, success } = states || {};
  const [displayState, setDisplayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const toastID = React.useId();

  // Handle state changes
  useEffect(() => {
    if (loading) {
      setDisplayState("loading");
      toast.loading(stateMessages?.loading, {
        id: toastID,
      });
    } else if (success) {
      setDisplayState("success");
      toast.success(stateMessages?.success, {
        id: toastID,
      });
      // Auto-reset success state after animation
      const timer = setTimeout(() => {
        setDisplayState("idle");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (error) {
      setDisplayState("error");
      toast.error(stateMessages?.error, {
        id: toastID,
      });
    } else {
      setDisplayState("idle");
    }
  }, [loading, success, error, stateMessages?.loading, stateMessages?.success, stateMessages?.error, toastID]);

  // Animation variants
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

  // Background color variants
  const backgroundVariants = {
    idle: {
      backgroundColor: "rgba(38, 38, 38, 1)", // neutral-800
      opacity: 1,
    },
    success: {
      backgroundColor: "rgba(22, 163, 74, 1)", // green-600
      opacity: 1,
    },
    error: {
      backgroundColor: "rgba(220, 38, 38, 1)", // red-600
      opacity: 1,
    },
    loading: {
      backgroundColor: "rgba(38, 38, 38, 1)", // neutral-800
      opacity: 1,
    },
  };

  // Content variants for icons and text
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  };

  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case "icon":
        return "p-3 h-11 w-11";
      case "compact":
        return "py-1.5 px-3";
      default:
        return "py-2 px-4 h-11";
    }
  };

  // Get content container classes
  const getContentClasses = () => {
    switch (size) {
      case "icon":
        return "h-5 w-5";
      case "compact":
        return "h-5 min-w-[60px]";
      default:
        return "h-6 min-w-[80px]";
    }
  };

  // Get the appropriate icon based on state
  const getStateIcon = () => {
    switch (displayState) {
      case "loading":
        return (
          <motion.div key="loader" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, ease: "linear" }}>
              <Loader2 className={size === "icon" ? "w-4 h-4" : "w-5 h-5"} />
            </motion.div>
          </motion.div>
        );
      case "success":
        return (
          <motion.div key="success" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center">
            <CheckCircle className={size === "icon" ? "w-4 h-4" : "w-5 h-5"} />
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            key="error"
            variants={contentVariants}
            initial="hidden"
            animate={{
              ...contentVariants.visible,
              x: [0, -3, 3, -3, 3, 0],
              transition: {
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
                x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
              },
            }}
            exit="exit"
            className="flex items-center justify-center"
          >
            <XCircle className={size === "icon" ? "w-4 h-4" : "w-5 h-5"} />
          </motion.div>
        );
      case "idle":
        return (
          <motion.div key="label" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center">
            {typeof label === "string" ? <span>{label}</span> : label}
          </motion.div>
        );
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative border border-transparent font-medium text-neutral-300 rounded overflow-hidden ${getSizeClasses()} ${disabled ? "cursor-not-allowed text-neutral-600 bg-neutral-800/30" : "hover:border-neutral-800 hover:text-neutral-100 cursor-pointer"}`}
      initial="initial"
      whileHover="hover"
      animate={disabled ? "disabled" : "initial"}
      variants={buttonVariants}
      type={type}
    >
      {/* Animated background */}
      <motion.div className="absolute inset-0 rounded" initial="idle" animate={displayState} variants={backgroundVariants} transition={{ duration: 0.3 }} />

      {/* Content container with size-appropriate dimensions */}
      <div className={`relative z-10 flex items-center justify-center text-center ${getContentClasses()}`}>
        <AnimatePresence mode="wait">{getStateIcon()}</AnimatePresence>
      </div>
    </motion.button>
  );
};

export default Button;
