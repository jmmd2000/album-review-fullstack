import { afterEach, beforeEach, describe, test, expect, vi, type MockInstance } from "vitest";
import { ArtistModel } from "@/api/models/Artist";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { SettingsService } from "@/api/services/SettingsService";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";
import { fetchArtistHeadersFromSpotify } from "@/helpers/fetchArtistHeaderFromSpotify";
import type { JobEmit } from "@/api/services/JobService";

vi.mock("@/helpers/fetchArtistFromSpotify", () => ({ fetchArtistFromSpotify: vi.fn() }));
vi.mock("@/helpers/fetchArtistHeaderFromSpotify", () => ({ fetchArtistHeadersFromSpotify: vi.fn() }));

const spotifyID = "artistWithAMovedImage1";
const photo = (url: string, size: number) => ({ url, width: size, height: size });

const oldHeader = "https://image-cdn-fa.spotifycdn.com/image/ab67618600000194ca40d0e310d671f99295b14c";
const movedHeader = "https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c";
const newHeader = "https://i2o.scdn.co/image/ab67618600001667c6ec4ec52e4a15d1ef981259";

const oldPhotos = [photo("https://i.scdn.co/image/ab6761610000e5ebc65d8681d3d4dbb49dd6ff83", 640)];
const movedPhotos = [photo("https://i.scdn.co/image/ab6761610000e5ebc65d8681d3d4dbb49dd6ff83", 640), photo("https://i.scdn.co/image/ab67616100005174c65d8681d3d4dbb49dd6ff83", 320)];
const newPhotos = [photo("https://i.scdn.co/image/ab6761610000e5eb1ba8fc5f5c73e7e9313cc6eb", 640)];

let updateArtist: MockInstance<typeof ArtistModel.updateArtist>;
let events: string[];
const emit: JobEmit = event => events.push(event);

beforeEach(() => {
  events = [];
  vi.spyOn(ArtistModel, "getAllArtists").mockResolvedValue([{ spotifyID, name: "Artist", headerImage: oldHeader, imageURLs: oldPhotos }] as never);
  vi.spyOn(SettingsService, "setJobResult").mockResolvedValue();
  vi.spyOn(SettingsService, "setLastRun").mockResolvedValue();
  updateArtist = vi.spyOn(ArtistModel, "updateArtist").mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("header refresh", () => {
  test("a header moved to a new host and size counts as the same, and keeps the new URL without a new update time", async () => {
    vi.mocked(fetchArtistHeadersFromSpotify).mockResolvedValue({ [spotifyID]: movedHeader });

    await ArtistImageService.updateArtistHeaders(true, undefined, emit, "manual");

    expect(events).toContain("same");
    expect(updateArtist).toHaveBeenCalledWith(spotifyID, { headerImage: movedHeader });
  });

  test("a different header counts as a change and sets a new update time", async () => {
    vi.mocked(fetchArtistHeadersFromSpotify).mockResolvedValue({ [spotifyID]: newHeader });

    await ArtistImageService.updateArtistHeaders(true, undefined, emit, "manual");

    expect(events).toContain("changed");
    expect(updateArtist).toHaveBeenCalledWith(spotifyID, { headerImage: newHeader, imageUpdatedAt: expect.any(Date) });
  });
});

describe("photo refresh", () => {
  test("a photo with new sizes counts as the same, and keeps the new URLs without a new update time", async () => {
    vi.mocked(fetchArtistFromSpotify).mockResolvedValue({ id: spotifyID, name: "Artist", images: movedPhotos });

    await ArtistImageService.updateArtistImages(true, undefined, emit, "manual");

    expect(events).toContain("same");
    expect(updateArtist).toHaveBeenCalledWith(spotifyID, { imageURLs: movedPhotos });
  });

  test("a photo with the same URLs isn't saved again", async () => {
    vi.mocked(fetchArtistFromSpotify).mockResolvedValue({ id: spotifyID, name: "Artist", images: oldPhotos });

    await ArtistImageService.updateArtistImages(true, undefined, emit, "manual");

    expect(events).toContain("same");
    expect(updateArtist).not.toHaveBeenCalled();
  });

  test("a different photo counts as a change and sets a new update time", async () => {
    vi.mocked(fetchArtistFromSpotify).mockResolvedValue({ id: spotifyID, name: "Artist", images: newPhotos });

    await ArtistImageService.updateArtistImages(true, undefined, emit, "manual");

    expect(events).toContain("changed");
    expect(updateArtist).toHaveBeenCalledWith(spotifyID, { imageURLs: newPhotos, imageUpdatedAt: expect.any(Date) });
  });
});
