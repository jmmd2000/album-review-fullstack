interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ label, onClick, disabled }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border border-transparent bg-neutral-800 transition-colors text-neutral-200 font-medium py-2 px-4 rounded cursor-pointer ${
        disabled ? "cursor-not-allowed text-neutral-600 bg-neutral-700/10" : "hover:bg-neutral-900 hover:border-neutral-800 hover:text-neutral-100"
      }`}
    >
      {label}
    </button>
  );
};

export default Button;
