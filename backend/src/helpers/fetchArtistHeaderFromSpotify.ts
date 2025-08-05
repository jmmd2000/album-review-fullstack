import puppeteer, { Browser, Page } from "puppeteer";

// Global browser instance for reuse
let globalBrowser: Browser | null = null;

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

// Initialize browser once and reuse
async function getBrowser(): Promise<Browser> {
  if (!globalBrowser || !globalBrowser.connected) {
    globalBrowser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    // Clean up on process exit
    process.on("exit", () => closeBrowser());
    process.on("SIGTERM", () => closeBrowser());
    process.on("SIGINT", () => closeBrowser());
  }
  return globalBrowser;
}

async function closeBrowser(): Promise<void> {
  if (globalBrowser) {
    await globalBrowser.close();
    globalBrowser = null;
  }
}

// Single artist fetch (for backward compat)
export async function fetchArtistHeaderFromSpotify(
  spotifyArtistID: string,
  fake: boolean = false
): Promise<string | null> {
  const results = await fetchArtistHeadersFromSpotify(
    [spotifyArtistID],
    3,
    undefined,
    fake
  );
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
        results[spotifyArtistID] = success ? getFakeHeaderUrl() : null;

        completed++;
        if (onProgress) {
          onProgress(completed, spotifyArtistIDs.length, spotifyArtistID);
        }
      });

      await Promise.all(promises);
    }

    console.log(
      `FAKE MODE: Batch complete. Results: ${
        Object.values(results).filter(Boolean).length
      }/${spotifyArtistIDs.length} headers "found"`
    );
    return results;
  }
  // -- /fake mode for testing

  // Real implementation
  const browser = await getBrowser();

  // Process in batches to avoid overwhelming the browser
  const chunks = [];
  for (let i = 0; i < spotifyArtistIDs.length; i += concurrency) {
    chunks.push(spotifyArtistIDs.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async spotifyArtistID => {
      const page = await browser.newPage();

      try {
        // Set longer timeouts
        page.setDefaultTimeout(15000);
        page.setDefaultNavigationTimeout(15000);

        // Block unnecessary resources to speed up loading
        await page.setRequestInterception(true);
        page.on("request", req => {
          const resourceType = req.resourceType();
          if (["stylesheet", "font", "image"].includes(resourceType)) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await page.goto(`https://open.spotify.com/artist/${spotifyArtistID}`, {
          waitUntil: "domcontentloaded",
        });

        // Wait longer and just use the reliable selector
        await page.waitForSelector('div[data-testid="background-image"]', {
          timeout: 10000,
        });

        const bannerUrl = await page.evaluate(() => {
          const bgDiv = document.querySelector(
            'div[data-testid="background-image"]'
          );
          if (!bgDiv) return null;
          const style = bgDiv.getAttribute("style");
          const match = style?.match(/url\("(.+?)"\)/);
          return match?.[1] ?? null;
        });

        results[spotifyArtistID] = bannerUrl;

        // Emit progress after each completion
        completed++;
        if (onProgress) {
          onProgress(completed, spotifyArtistIDs.length, spotifyArtistID);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to fetch header for ${spotifyArtistID}:`,
          errorMessage
        );
        results[spotifyArtistID] = null;

        // Still count as completed for progress
        completed++;
        if (onProgress) {
          onProgress(completed, spotifyArtistIDs.length, spotifyArtistID);
        }
      } finally {
        await page.close();
      }
    });

    // Wait for current batch to complete before starting next
    await Promise.all(promises);
  }

  console.log(
    `Batch complete. Results: ${
      Object.values(results).filter(Boolean).length
    }/${spotifyArtistIDs.length} headers found`
  );
  return results;
}

export { closeBrowser };
