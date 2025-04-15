import puppeteer from "puppeteer";

/**
 * Scrapes the header image from a Spotify artist page.
 * @param spotifyArtistID - The Spotify ID of the artist
 * @returns The header image URL, or null if not found
 */

export async function fetchArtistHeaderFromSpotify(spotifyArtistID: string): Promise<string | null> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://open.spotify.com/artist/${spotifyArtistID}`, {
    waitUntil: "networkidle0",
  });

  // Replace with the actual selector for the banner, which might be a CSS background-image
  const bannerUrl = await page.evaluate(() => {
    const bgDiv = document.querySelector('div[data-testid="background-image"]');
    if (!bgDiv) return null;
    const style = bgDiv.getAttribute("style");
    const match = style?.match(/url\("(.+?)"\)/);
    return match?.[1] ?? null;
  });

  await browser.close();
  return bannerUrl;
}
