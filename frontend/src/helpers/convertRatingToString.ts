export const convertRatingToString = (rating: number): string => {
  switch (rating) {
    case 0:
      return "Non-song";
    case 1:
      return "Terrible";
    case 2:
      return "Awful";
    case 3:
      return "Bad";
    case 4:
      return "OK";
    case 5:
      return "Meh";
    case 6:
      return "Good";
    case 7:
      return "Great";
    case 8:
      return "Brilliant";
    case 9:
      return "Amazing";
    case 10:
      return "Perfect";
    default:
      return "Invalid rating";
  }
};
