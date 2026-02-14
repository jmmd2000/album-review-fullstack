import { ExtractedColor } from "@shared/types";
import { Dispatch, SetStateAction } from "react";

interface ColourPickerProps {
  selectedColors: ExtractedColor[];
  setSelectedColors: Dispatch<SetStateAction<ExtractedColor[]>>;
}

export const ColourPicker = ({ selectedColors, setSelectedColors }: ColourPickerProps) => {
  const addColor = () => {
    if (selectedColors.length < 5) {
      const updatedColors = [...selectedColors, { hex: "#ffffff" }];
      setSelectedColors(updatedColors);
    }
  };

  const removeColor = (index: number) => {
    const updatedColors = selectedColors.filter((_, i) => i !== index);
    setSelectedColors(updatedColors);
  };

  const handleColorChange = (index: number, newColor: string) => {
    const updatedColors = [...selectedColors];
    updatedColors[index] = { hex: newColor };
    setSelectedColors(updatedColors);
  };

  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40">
      <label className="block text-zinc-200 font-medium mb-3">
        Album Colors <span className="text-neutral-500">(max 5)</span>
      </label>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {selectedColors.map((color, index) => (
          <div className="relative group z-10" key={index}>
            <div
              className={
                "w-12 h-12 rounded-full border-2 border-neutral-700 overflow-hidden shadow-lg transition-transform hover:scale-105"
              }
              style={{ backgroundColor: color.hex }}
            >
              <input
                type="color"
                value={color.hex}
                onChange={e => handleColorChange(index, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={() => removeColor(index)}
              className="absolute -top-2 -right-2 bg-neutral-800 text-red-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
        {selectedColors.length < 5 && (
          <button
            type="button"
            onClick={addColor}
            className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:border-neutral-400 transition-colors"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};
