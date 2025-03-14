/**
 * A mapping of rating numbers to corresponding background tailwindCSS color classes.
 */
export const ratingColorsBackground: { [key: number]: string } = {
  // Non-song
  0: "bg-slate-700",
  // Terrible
  1: "bg-slate-600",
  // Awful
  2: "bg-red-600",
  // Bad
  3: "bg-orange-600",
  // OK
  4: "bg-yellow-600",
  // Decent
  5: "bg-lime-600",
  // Good
  6: "bg-emerald-600",
  // Great
  7: "bg-cyan-600",
  // Brilliant
  8: "bg-blue-600",
  // Amazing
  9: "bg-violet-600",
  // Perfect
  10: "bg-fuchsia-600",
};

/**
 * A mapping of rating numbers to corresponding text tailwindCSS color classes.
 */
export const ratingColorsText: { [key: number]: string } = {
  // Non-song
  0: "text-slate-600",
  // Terrible
  1: "text-slate-500",
  // Awful
  2: "text-red-500",
  // Bad
  3: "text-orange-500",
  // OK
  4: "text-yellow-500",
  // Decent
  5: "text-lime-500",
  // Good
  6: "text-emerald-500",
  // Great
  7: "text-cyan-500",
  // Brilliant
  8: "text-blue-500",
  // Amazing
  9: "text-violet-500",
  // Perfect
  10: "text-fuchsia-500",
};

/**
 * A mapping of rating numbers to corresponding 'from' gradient tailwindCSS color classes.
 */
export const ratingColorsGradient: { [key: number]: string } = {
  // Non-song
  0: "from-slate-700/60",
  // Terrible
  1: "from-slate-600/60",
  // Awful
  2: "from-red-600/60",
  // Bad
  3: "from-orange-600/60",
  // OK
  4: "from-yellow-600/60",
  // Decent
  5: "from-lime-600/60",
  // Good
  6: "from-emerald-600/60",
  // Great
  7: "from-cyan-600/60",
  // Brilliant
  8: "from-blue-600/60",
  // Amazing
  9: "from-violet-600/60",
  // Perfect
  10: "from-fuchsia-600/60",
};

/**
 * A mapping of rating numbers to corresponding border tailwindCSS color classes.
 */
export const ratingColorsBorder: { [key: number]: string } = {
  // Non-song
  0: "border-slate-600",
  // Terrible
  1: "border-slate-500",
  // Awful
  2: "border-red-500",
  // Bad
  3: "border-orange-500",
  // OK
  4: "border-yellow-500",
  // Decent
  5: "border-lime-500",
  // Good
  6: "border-emerald-500",
  // Great
  7: "border-cyan-500",
  // Brilliant
  8: "border-blue-500",
  // Amazing
  9: "border-violet-500",
  // Perfect
  10: "border-fuchsia-500",
};

/**
 * Converts a rating number to a corresponding tailwind class for different parts of a component.
 *
 * @param {number} rating - The numerical rating to convert.
 * @param {Object} [options] - Options to specify the type of color to return.
 * @param {boolean} [options.text] - If true, returns the text color corresponding to the rating.
 * @param {boolean} [options.gradient] - If true, returns the gradient color corresponding to the rating.
 * @param {boolean} [options.border] - If true, returns the border color corresponding to the rating.
 * @returns {string} The color corresponding to the rating based on the provided options.
 */
export const convertRatingToColor = (rating: number, options: { text?: boolean; gradient?: boolean; border?: boolean } = {}) => {
  if (options.text) return ratingColorsText[rating] ?? "text-gray-500";
  if (options.gradient) return ratingColorsGradient[rating] ?? "from-gray-500/40";
  if (options.border) return ratingColorsBorder[rating] ?? "border-gray-500";
  return ratingColorsBackground[rating] ?? "bg-gray-500";
};
