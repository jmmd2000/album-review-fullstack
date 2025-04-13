interface HeaderDetailsProps {
  /*** The name to be displayed */
  name: string;
  /** The image to be displayed */
  imageURL: string;
  /** Optional album ID to bind the transition */
  albumID?: string;
}

const HeaderDetails = ({ name, imageURL, albumID }: HeaderDetailsProps) => {
  return (
    <div className="text-gray-100 max-w-[80%] mx-auto flex flex-col lg:flex-row mt-24 md:mt-0 md:h-full items-center justify-center gap-8">
      <img src={imageURL} alt={name} className="rounded-lg h-60 w-60 lg:h-72 lg:w-72 shadow-2xl" style={{ viewTransitionName: `album-image-${albumID}` }} />
      <div className="flex flex-col gap-2 px-0 py-1 relative">
        <h1 className=" text-5xl lg:text-6xl font-bold drop-shadow-lg">{name}</h1>
      </div>
    </div>
  );
};

export default HeaderDetails;
