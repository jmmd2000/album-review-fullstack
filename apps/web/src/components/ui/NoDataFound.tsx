interface NoDataFoundProps {
  message: string;
}

/** A placeholder for a panel whose data didn't arrive. */
export const NoDataFound = ({ message }: NoDataFoundProps) => {
  return <p className="flex items-center text-neutral-400 w-full h-full justify-center">{message}</p>;
};
