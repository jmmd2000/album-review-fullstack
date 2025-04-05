interface ButtonProps {
  /** The label to display on the button */
  label: string | React.ReactNode;
  /** Function to call when the button is clicked */
  onClick?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * This component creates a button with a label and an optional click handler.
 */
const Button = ({ label, onClick, disabled }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded ${
        disabled ? "cursor-not-allowed text-neutral-600 bg-neutral-700/10" : "hover:bg-neutral-900 hover:border-neutral-800 hover:text-neutral-100 cursor-pointer"
      }`}
    >
      {label}
    </button>
  );
};

export default Button;
