import Button from "@components/Button";

interface CardGridControlsProps {
  nextPage: () => void;
  previousPage: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}

const CardGridControls = ({ nextPage, previousPage, nextDisabled, previousDisabled }: CardGridControlsProps) => {
  console.log(nextDisabled, previousDisabled);
  return (
    <div className="sticky top-0 bg-gradient-to-b from-neutral-900/60 via-neutral-900/30 to-neutral-900/0 z-10">
      <div className="flex gap-3 max-w-[1900px] mx-4 backdrop-blur-sm px-2 py-4 z-10">
        <div className="flex justify-center gap-2">
          <input type="text" placeholder="Search..." className="rounded-sm p-2 bg-neutral-800 px-4" />
          <Button label={"Search"} />
        </div>

        <div className="ml-auto flex justify-center items-center gap-2">
          <Button label="Previous" onClick={previousPage} disabled={previousDisabled} />
          <Button label="Next" onClick={nextPage} disabled={nextDisabled} />
        </div>
      </div>
    </div>
  );
};

export default CardGridControls;
