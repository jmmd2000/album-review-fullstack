export type RatingTier = {
  label: string;
  range: [number, number];
  backgroundColor: string;
  textColor: string;
  gradientStart: string;
  borderColor: string;
};

const ratingTiers: RatingTier[] = [
  {
    label: "Non-song",
    range: [0, 0],
    backgroundColor: "bg-slate-600/10",
    textColor: "text-slate-500",
    gradientStart: "from-slate-600/40",
    borderColor: "border-slate-500",
  },
  {
    label: "Terrible",
    range: [1, 10],
    backgroundColor: "bg-red-900/10",
    textColor: "text-red-900",
    gradientStart: "from-red-900/40",
    borderColor: "border-red-900",
  },
  {
    label: "Awful",
    range: [11, 20],
    backgroundColor: "bg-red-600/10",
    textColor: "text-red-500",
    gradientStart: "from-red-600/40",
    borderColor: "border-red-500",
  },
  {
    label: "Bad",
    range: [21, 30],
    backgroundColor: "bg-orange-600/10",
    textColor: "text-orange-500",
    gradientStart: "from-orange-600/40",
    borderColor: "border-orange-500",
  },
  {
    label: "OK",
    range: [31, 40],
    backgroundColor: "bg-yellow-600/10",
    textColor: "text-yellow-500",
    gradientStart: "from-yellow-600/40",
    borderColor: "border-yellow-500",
  },
  {
    label: "Meh",
    range: [41, 50],
    backgroundColor: "bg-lime-600/10",
    textColor: "text-lime-500",
    gradientStart: "from-lime-600/40",
    borderColor: "border-lime-500",
  },
  {
    label: "Good",
    range: [51, 60],
    backgroundColor: "bg-emerald-600/10",
    textColor: "text-emerald-500",
    gradientStart: "from-emerald-600/40",
    borderColor: "border-emerald-500",
  },
  {
    label: "Great",
    range: [61, 70],
    backgroundColor: "bg-cyan-600/10",
    textColor: "text-cyan-500",
    gradientStart: "from-cyan-600/40",
    borderColor: "border-cyan-500",
  },
  {
    label: "Brilliant",
    range: [71, 80],
    backgroundColor: "bg-blue-600/10",
    textColor: "text-blue-500",
    gradientStart: "from-blue-600/40",
    borderColor: "border-blue-500",
  },
  {
    label: "Amazing",
    range: [81, 90],
    backgroundColor: "bg-violet-600/10",
    textColor: "text-violet-500",
    gradientStart: "from-violet-600/40",
    borderColor: "border-violet-500",
  },
  {
    label: "Perfect",
    range: [91, 100],
    backgroundColor: "bg-fuchsia-600/10",
    textColor: "text-fuchsia-500",
    gradientStart: "from-fuchsia-600/40",
    borderColor: "border-fuchsia-500",
  },
];

export const getRatingStyles = (rating: number | undefined) => {
  if (rating === undefined) return ratingTiers[0];
  const tier = ratingTiers.find(({ range }) => rating >= range[0] && rating <= range[1]);
  if (!tier) {
    throw new Error("Rating must be between 0 and 100.");
  }
  return tier;
};
