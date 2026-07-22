import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { env } from "@/config/env";

// Scrapes run through the browserless sidecar
const browserWSEndpoint = `${env.BROWSERLESS_URL}?token=${env.BROWSERLESS_TOKEN}`;

// Fake header URLs for testing
const FAKE_HEADERS = [
  "https://i.scdn.co/image/ab6761610000e5eb1234567890abcdef12345678",
  "https://i.scdn.co/image/ab6761610000e5eb87654321fedcba0987654321",
  "https://i.scdn.co/image/ab6761610000e5eba1b2c3d4e5f6789012345678",
  "https://i.scdn.co/image/ab6761610000e5eb9876543210fedcba87654321",
  "https://i.scdn.co/image/ab6761610000e5ebdeadbeefcafebabe12345678",
];

// simulate real network requests
function fakeDelay(): Promise<void> {
  const delay = Math.random() * 2000 + 500; // 500-2500ms
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Generate a fake header URL
function getFakeHeaderUrl(): string {
  return FAKE_HEADERS[Math.floor(Math.random() * FAKE_HEADERS.length)];
}

// Single artist fetch (for backward compat)
export async function fetchArtistHeaderFromSpotify(spotifyArtistID: string, fake: boolean = false): Promise<string | null> {
  const results = await fetchArtistHeadersFromSpotify([spotifyArtistID], 3, undefined, fake);
  return results[spotifyArtistID] || null;
}

// Batch fetch
export async function fetchArtistHeadersFromSpotify(
  spotifyArtistIDs: string[],
  concurrency: number = 1,
  onProgress?: (completed: number, total: number, artistName?: string) => void,
  fake: boolean = false
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  let completed = 0;

  const markDone = (spotifyArtistID: string, bannerUrl: string | null) => {
    results[spotifyArtistID] = bannerUrl;
    completed++;
    if (onProgress) {
      onProgress(completed, spotifyArtistIDs.length, spotifyArtistID);
    }
  };

  // -- fake mode for testing
  if (fake) {
    // Process in chunks to simulate real batching behavior
    const chunks = [];
    for (let i = 0; i < spotifyArtistIDs.length; i += concurrency) {
      chunks.push(spotifyArtistIDs.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async spotifyArtistID => {
        // Simulate network delay
        await fakeDelay();

        // simulate real conditions with some failures
        const success = Math.random() > 0.1;
        markDone(spotifyArtistID, success ? getFakeHeaderUrl() : null);
      });

      await Promise.all(promises);
    }

    return results;
  }
  // -- /fake mode for testing

  // Real implementation
  const chunks = [];
  for (let i = 0; i < spotifyArtistIDs.length; i += concurrency) {
    chunks.push(spotifyArtistIDs.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    // One browserless session per chunk, shared by its pages
    let browser: Browser;
    try {
      browser = await puppeteer.connect({ browserWSEndpoint });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to open a browserless session:", errorMessage);
      for (const spotifyArtistID of chunk) {
        markDone(spotifyArtistID, null);
      }
      continue;
    }

    const promises = chunk.map(async spotifyArtistID => {
      let page: Page | null = null;

      try {
        page = await browser.newPage();

        // Set longer timeouts
        page.setDefaultTimeout(20000);
        page.setDefaultNavigationTimeout(20000);

        await page.setViewport({ width: 1920, height: 1080 });

        // Block unnecessary resources but allow images (needed for background)
        await page.setRequestInterception(true);
        page.on("request", req => {
          const resourceType = req.resourceType();
          const url = req.url();

          // Block fonts and some scripts, but allow images and main resources
          if (["font"].includes(resourceType) || url.includes("google-analytics") || url.includes("googletagmanager")) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await page.goto(`https://open.spotify.com/artist/${spotifyArtistID}`, {
          waitUntil: "domcontentloaded",
        });

        // Wait for the page to load and try multiple selectors
        let bannerUrl: string | null = null;

        // Try multiple selectors in order of preference
        const selectors = ['div[data-testid="background-image"]', '[data-testid="background-image"]', ".background-image", '[style*="background-image"]', 'div[style*="background"]'];

        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });

            bannerUrl = await page.evaluate(sel => {
              const element = document.querySelector(sel);
              if (!element) return null;

              // Try to get background image from style attribute
              const style = element.getAttribute("style");
              if (style) {
                const match = style.match(/url\(["']?([^"']+)["']?\)/);
                if (match) return match[1];
              }

              // Try computed style
              const computedStyle = window.getComputedStyle(element);
              const bgImage = computedStyle.backgroundImage;
              if (bgImage && bgImage !== "none") {
                const match = bgImage.match(/url\(["']?([^"']+)["']?\)/);
                if (match) return match[1];
              }

              return null;
            }, selector);

            if (bannerUrl) break;
          } catch {
            // Continue to next selector
            continue;
          }
        }

        // If no banner found with selectors, try to find any image with Spotify CDN
        if (!bannerUrl) {
          bannerUrl = await page.evaluate(() => {
            const images = document.querySelectorAll('img, [style*="background-image"]');
            for (const img of images) {
              let src = "";
              if (img.tagName === "IMG") {
                src = (img as HTMLImageElement).src;
              } else {
                const style = img.getAttribute("style");
                if (style) {
                  const match = style.match(/url\(["']?([^"']+)["']?\)/);
                  if (match) src = match[1];
                }
              }

              if (src && src.includes("i.scdn.co") && src.includes("ab676161")) {
                return src;
              }
            }
            return null;
          });
        }

        markDone(spotifyArtistID, bannerUrl);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to fetch header for ${spotifyArtistID}:`, errorMessage);

        // Log additional debugging info
        try {
          const url = page ? await page.url() : "(no page)";
          const title = page ? await page.title() : "(no page)";
          console.error(`Page URL: ${url}, Title: ${title}`);
        } catch {
          console.error("Could not get page info for debugging");
        }

        markDone(spotifyArtistID, null);
      } finally {
        // The page may already be gone if the sidecar cuts off
        if (page) await page.close().catch(() => {});
      }
    });

    // Wait for current batch to complete before starting next
    await Promise.all(promises);

    // Ends this chunks browserless session
    await browser.close().catch(() => {});
  }

  return results;
}
