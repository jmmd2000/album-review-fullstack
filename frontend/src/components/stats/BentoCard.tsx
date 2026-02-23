interface BentoCardProps {
  /** The content to display inside the card */
  children?: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
}

/**
 *  A simple card component with a dark background, backdrop blur, and hover effect.
 *   Used for displaying various content in a card format.
 *  @param {React.ReactNode} children The content to display inside the card
 *  @param {string} className Optional additional class names for styling
 *
 *  @returns {JSX.Element} The rendered card component
 */
const BentoCard = ({ children, className }: BentoCardProps) => {
  return (
    <div
      className={`bg-neutral-800/50 backdrop-blur-sm border-neutral-600/50 hover:bg-neutral-800/80 transition-all duration-200 flex flex-col gap-6 rounded-lg border py-3 3xl:py-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

export default BentoCard;
