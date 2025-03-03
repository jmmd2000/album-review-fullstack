export const convertRatingToColor = (rating: number): string => {
  switch (rating) {
    case 0:
      return "-gray-500";
    case 1:
    case 2:
    case 3:
      return "-red-500";
    case 4:
    case 5:
      return "-yellow-500";
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      return "-green-500";
    default:
      return "-gray-500";
  }
};
