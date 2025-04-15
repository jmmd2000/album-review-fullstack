export type RatingTier = {
  label: string;
  range: [number, number];
  backgroundColor: string;
  backgroundColorLighter: string;
  textColor: string;
  gradientStart: string;
  gradientStartOKLCH: string;
  borderColor: string;
};

const ratingTiers: RatingTier[] = [
  {
    label: "Non-song",
    range: [0, 0],
    backgroundColor: "bg-slate-600",
    backgroundColorLighter: "bg-slate-500/20",
    textColor: "text-slate-500",
    gradientStart: "from-slate-600",
    gradientStartOKLCH: "oklch(44.6% 0.043 257.281/ 0.6)",
    borderColor: "border-slate-500",
  },
  {
    label: "Terrible",
    range: [1, 10],
    backgroundColor: "bg-red-900",
    backgroundColorLighter: "bg-red-800/20",
    textColor: "text-red-900",
    gradientStart: "from-red-900",
    gradientStartOKLCH: "oklch(39.6% 0.141 25.723/ 0.6)",
    borderColor: "border-red-900",
  },
  {
    label: "Awful",
    range: [11, 20],
    backgroundColor: "bg-red-600",
    backgroundColorLighter: "bg-red-500/20",
    textColor: "text-red-500",
    gradientStart: "from-red-600",
    gradientStartOKLCH: "oklch(57.7% 0.245 27.325/ 0.6)",
    borderColor: "border-red-500",
  },
  {
    label: "Bad",
    range: [21, 30],
    backgroundColor: "bg-orange-600",
    backgroundColorLighter: "bg-orange-500/20",
    textColor: "text-orange-500",
    gradientStart: "from-orange-600",
    gradientStartOKLCH: "oklch(64.6% 0.222 41.116/ 0.6)",
    borderColor: "border-orange-500",
  },
  {
    label: "OK",
    range: [31, 40],
    backgroundColor: "bg-yellow-600",
    backgroundColorLighter: "bg-yellow-500/20",
    textColor: "text-yellow-500",
    gradientStart: "from-yellow-600",
    gradientStartOKLCH: "oklch(68.1% 0.162 75.834/ 0.6)",
    borderColor: "border-yellow-500",
  },
  {
    label: "Meh",
    range: [41, 50],
    backgroundColor: "bg-lime-600",
    backgroundColorLighter: "bg-lime-500/20",
    textColor: "text-lime-500",
    gradientStart: "from-lime-600",
    gradientStartOKLCH: "oklch(64.8% 0.2 131.684/ 0.6)",
    borderColor: "border-lime-500",
  },
  {
    label: "Good",
    range: [51, 60],
    backgroundColor: "bg-emerald-600",
    backgroundColorLighter: "bg-emerald-500/20",
    textColor: "text-emerald-500",
    gradientStart: "from-emerald-600",
    gradientStartOKLCH: "oklch(59.6% 0.145 163.225/ 0.6)",
    borderColor: "border-emerald-500",
  },
  {
    label: "Great",
    range: [61, 70],
    backgroundColor: "bg-cyan-600",
    backgroundColorLighter: "bg-cyan-500/20",
    textColor: "text-cyan-500",
    gradientStart: "from-cyan-600",
    gradientStartOKLCH: "oklch(60.9% 0.126 221.723/ 0.6)",
    borderColor: "border-cyan-500",
  },
  {
    label: "Brilliant",
    range: [71, 80],
    backgroundColor: "bg-blue-600",
    backgroundColorLighter: "bg-blue-500/20",
    textColor: "text-blue-500",
    gradientStart: "from-blue-600",
    gradientStartOKLCH: "oklch(54.6% 0.245 262.881/ 0.6)",
    borderColor: "border-blue-500",
  },
  {
    label: "Amazing",
    range: [81, 90],
    backgroundColor: "bg-violet-600",
    backgroundColorLighter: "bg-violet-500/20",
    textColor: "text-violet-500",
    gradientStart: "from-violet-600",
    gradientStartOKLCH: "oklch(54.1% 0.281 293.009/ 0.6)",
    borderColor: "border-violet-500",
  },
  {
    label: "Perfect",
    range: [91, 100],
    backgroundColor: "bg-fuchsia-600",
    backgroundColorLighter: "bg-fuchsia-500/20",
    textColor: "text-fuchsia-500",
    gradientStart: "from-fuchsia-600",
    gradientStartOKLCH: "oklch(59.1% 0.293 322.896/ 0.6)",
    borderColor: "border-fuchsia-500",
  },
];

export const getRatingStyles = (rating: number | string | undefined) => {
  if (rating === undefined) return ratingTiers.find((t) => t.label === "Non-song")!;

  // Handle string labels (like "Amazing", "Meh", etc.)
  if (typeof rating === "string") {
    const tier = ratingTiers.find((t) => t.label.toLowerCase() === rating.toLowerCase());
    if (!tier) throw new Error(`Unknown rating label: "${rating}"`);
    return tier;
  }

  // Handle numeric ratings
  const roundedRating = Math.ceil(rating);
  const tier = ratingTiers.find(({ range }) => roundedRating >= range[0] && roundedRating <= range[1]);
  if (!tier) throw new Error(`Rating must be between 0 and 100. (${roundedRating})`);
  return tier;
};
