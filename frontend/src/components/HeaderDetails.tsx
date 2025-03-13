interface HeaderDetailsProps {
  /*** The name to be displayed */
  name: string;
  /** The image to be displayed */
  imageURL: string;
}

/**
 * This component is used to display the an image and a name and is used on the album and artist detail pages
 */
const HeaderDetails = (props: HeaderDetailsProps) => {
  const { name, imageURL } = props;
  return (
    <div className="text-gray-100 max-w-[60%] mx-auto p-5 flex h-full items-center justify-center gap-8 px-16">
      <img src={imageURL} alt={name} className="rounded-lg h-72 w-72 shadow-2xl" />
      <div className="flex flex-col gap-2 px-0 py-1 relative">
        <h1 className="text-6xl font-bold drop-shadow-lg">{name}</h1>
      </div>
    </div>
  );
};

export default HeaderDetails;
