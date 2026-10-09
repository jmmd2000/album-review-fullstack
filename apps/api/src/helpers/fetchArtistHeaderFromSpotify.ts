import puppeteer, { type Browser, type HTTPResponse, type Page } from "puppeteer-core";
import { env } from "@/config/env";
import { readHeaderImage, type HeaderResult } from "@/helpers/artistHeaderImage";

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

/** The web player's request for an artist's page data, which holds the header. */
function isArtistOverviewResponse(response: HTTPResponse): boolean {
  if (!response.url().includes("/pathfinder/")) return false;
  const body = response.request().postData() ?? "";
  return body.includes('"operationName":"queryArtistOverview"');
}

/**
 * Gets one artist's header URL from their Spotify page.
 * @returns The header URL, or null if the artist has no header or the scrape failed.
 */
export async function fetchArtistHeaderFromSpotify(spotifyArtistID: string, fake: boolean = false): Promise<string | null> {
  const results = await fetchArtistHeadersFromSpotify([spotifyArtistID], 3, undefined, fake);
  const result = results[spotifyArtistID];
  if (result?.status !== "found") return null;
  return result.url;
}

/**
 * Gets each artist's header from their Spotify page, a few pages at a time.
 * It reads the header from the artist data the page loads, not from the page itself.
 * @returns A result for each artist: the header URL, "none" if Spotify says there's no header, or "failed".
 */
export async function fetchArtistHeadersFromSpotify(
  spotifyArtistIDs: string[],
  concurrency: number = 1,
  onProgress?: (completed: number, total: number, artistName?: string) => void,
  fake: boolean = false
): Promise<Record<string, HeaderResult>> {
  const results: Record<string, HeaderResult> = {};
  let completed = 0;

  const markDone = (spotifyArtistID: string, result: HeaderResult) => {
    results[spotifyArtistID] = result;
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
        markDone(spotifyArtistID, success ? { status: "found", url: getFakeHeaderUrl() } : { status: "failed" });
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
        markDone(spotifyArtistID, { status: "failed" });
      }
      continue;
    }

    const promises = chunk.map(async spotifyArtistID => {
      let page: Page | null = null;

      try {
        page = await browser.newPage();

        page.setDefaultTimeout(20000);
        page.setDefaultNavigationTimeout(20000);

        // Only the page's data is needed, so skip the images, fonts and media
        await page.setRequestInterception(true);
        page.on("request", request => {
          if (["image", "font", "media"].includes(request.resourceType())) {
            void request.abort();
          } else {
            void request.continue();
          }
        });

        const [overviewResponse] = await Promise.all([
          page.waitForResponse(isArtistOverviewResponse),
          page.goto(`https://open.spotify.com/artist/${spotifyArtistID}`, { waitUntil: "domcontentloaded" }),
        ]);

        if (!overviewResponse.ok()) {
          console.error(`Spotify answered ${overviewResponse.status()} for the artist data of ${spotifyArtistID}`);
          markDone(spotifyArtistID, { status: "failed" });
          return;
        }

        markDone(spotifyArtistID, readHeaderImage(await overviewResponse.json(), spotifyArtistID));
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

        markDone(spotifyArtistID, { status: "failed" });
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
