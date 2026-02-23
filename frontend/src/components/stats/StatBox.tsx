import { JSX } from "react";

interface StatBoxProps {
  /** The icon to display in the box */
  icon: JSX.Element;
  /** The label for the stat */
  label: string;
  /** The numeric value of the stat */
  value: number;
}

/**
 * A simple stat box component that displays an icon, label, and value.
 * Used for displaying statistics in a grid layout.
 * @param {JSX.Element} icon The icon to display in the box
 *  @param {string} label The label for the stat
 *  @param {number} value The numeric value of the stat
 *
 *  @returns {JSX.Element} The rendered card component
 */
const StatBox = ({ icon, label, value }: StatBoxProps) => {
  return (
    <div className="flex items-center justify-evenly gap-4 3xl:gap-6 h-full px-2 3xl:px-4">
      <div>
        <p className="text-2xl md:text-4xl 3xl:text-5xl font-bold text-white">
          {value.toLocaleString()}
        </p>
        <p className="text-xs 3xl:text-sm text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      {icon}
    </div>
  );
};

export default StatBox;
