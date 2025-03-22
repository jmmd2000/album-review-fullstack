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
    <div className="text-gray-100 max-w-[60%] mx-auto flex h-full items-center justify-center gap-8">
      <img src={imageURL} alt={name} className="rounded-lg h-72 w-72 shadow-2xl" style={{ viewTransitionName: `album-image-${albumID}` }} />
      <div className="flex flex-col gap-2 px-0 py-1 relative">
        <h1 className="text-6xl font-bold drop-shadow-lg">{name}</h1>
      </div>
    </div>
  );
};

export default HeaderDetails;
