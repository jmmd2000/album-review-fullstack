import { ExtractedColor } from "@shared/types";
import { extractColors } from "extract-colors";
import getPixels from "get-pixels";

/**
 * Extracts prominent colors from an album cover using specified options.
 *
 * @param {string} imageUrl - The URL of the image to process.
 * @returns {Promise<any>} A promise that resolves with the extracted colors or rejects with an error message.
 *
 * The function uses the following options for color extraction:
 * - `pixels`: The number of pixels to sample from the image.
 * - `distance`: The distance metric for color clustering.
 * - `colorValidator`: A function to filter out unwanted colors based on their RGBA values.
 *   - Removes fully transparent colors (alpha <= 250).
 *   - Removes near-black colors (RGB values < 70).
 *   - Removes near-white colors (RGB values > 210).
 * - `saturationDistance`: The distance metric for saturation clustering.
 * - `lightnessDistance`: The distance metric for lightness clustering.
 * - `hueDistance`: The distance metric for hue clustering.
 *
 * The function uses `getPixels` to load the image and `extractColors` to extract the colors.
 *
 * @throws Will throw an error if the image cannot be loaded or if the pixels data is undefined.
 */
export const getImageColors = async (imageUrl: string): Promise<ExtractedColor[]> => {
  const options = {
    pixels: 409600,
    distance: 0.45,
    colorValidator: (red: number, green: number, blue: number, alpha = 255) => {
      // Remove fully transparent colors
      if (alpha <= 250) return false;

      // Define tolerance levels for near-black and near-white
      const nearBlackThreshold = 70; // Colors with all RGB values < 30 are too dark
      const nearWhiteThreshold = 210; // Colors with all RGB values > 225 are too bright

      // Remove near-black colors
      if (red < nearBlackThreshold && green < nearBlackThreshold && blue < nearBlackThreshold) {
        return false;
      }

      // Remove near-white colors
      if (red > nearWhiteThreshold && green > nearWhiteThreshold && blue > nearWhiteThreshold) {
        return false;
      }

      return true; // Keep all other colors
    },
    saturationDistance: 0.3,
    lightnessDistance: 0.28,
    hueDistance: 0.12,
  };
  return new Promise((resolve, reject) => {
    getPixels(imageUrl, (err, pixels) => {
      if (err) {
        reject(`Error loading image: ${err.message}`);
        return;
      }

      if (!pixels) {
        reject("Pixels data is undefined.");
        return;
      }

      const data: number[] = Array.from(pixels.data);
      const [width, height]: [number, number] = pixels.shape as [number, number];

      extractColors({ data, width, height }, options)
        .then((colors) => {
          resolve(colors.map((color) => ({ hex: color.hex } as ExtractedColor)));
        })
        .catch(reject);
    });
  });
};
