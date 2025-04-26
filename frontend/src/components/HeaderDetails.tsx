import { cva } from "class-variance-authority";

interface HeaderDetailsProps {
  /*** The name to be displayed */
  name: string;
  /** The image to be displayed */
  imageURL: string;
  /** Optional view transition name to bind the transition */
  viewTransitionName?: string;
  /** Whether to add a small blurred background to the name to make it more readable against the background, mainly used for artist detail pages  */
  nameBackground?: boolean;
}

const HeaderDetails = ({ name, imageURL, viewTransitionName, nameBackground }: HeaderDetailsProps) => {
  const nameStyles = cva(["text-5xl", "lg:text-6xl", "flex-col", "font-bold", "drop-shadow-lg", "text-center", "lg:w-max"], {
    variants: {
      nameBackground: {
        true: "bg-black/20 backdrop-blur-sm px-5 py-3 rounded-lg border-t-1 border-r-1 border-b-2 border-l-2 border-neutral-900/20",
      },
    },
  });

  return (
    <div className="text-gray-100 max-w-[80%] mx-auto flex flex-col lg:flex-row mt-24 md:mt-0 md:h-full items-center justify-center gap-8">
      <img src={imageURL} alt={name} className="rounded-lg h-60 w-60 lg:h-72 lg:w-72 shadow-2xl border-1 border-neutral-900/30" style={{ viewTransitionName: viewTransitionName }} />
      <div className="flex flex-col gap-2 px-0 py-1 relative">
        <h1 className={nameStyles({ nameBackground })}>{name}</h1>
      </div>
    </div>
  );
};

export default HeaderDetails;
