import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import type { Jsonified, ReviewedAlbum, SpotifyAlbum } from "@shared/types";
import AlbumReviewForm from "../form/AlbumReviewForm";
import { queryClient } from "@/main";
import { client } from "@/lib/client";

vi.mock("@/main", async () => {
  const { QueryClient } = await import("@tanstack/react-query");
  return {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    }),
  };
});

vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        albums: {
          create: { $post: vi.fn() },
          ":albumID": { edit: { $put: vi.fn() } },
        },
      },
    },
  };
});

const jsonResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Error",
  json: async () => data,
});

const createPost = client.api.albums.create.$post as unknown as Mock;
const editPut = client.api.albums[":albumID"].edit.$put as unknown as Mock;

const spotifyAlbum = {
  id: "alb1",
  name: "Fresh Album",
  colors: [],
  artists: [{ id: "a1", name: "One" }],
  tracks: {
    items: [
      { id: "t1", name: "Track One", duration_ms: 200000, artists: [{ id: "a1", name: "One" }] },
      { id: "t2", name: "Track Two", duration_ms: 180000, artists: [{ id: "a1", name: "One" }] },
    ],
  },
} as unknown as Jsonified<SpotifyAlbum>;

const bonuses = {
  qualityBonus: 0,
  perfectBonus: 0,
  consistencyBonus: 0,
  noWeakBonus: 0,
  terriblePenalty: 0,
  poorQualityPenalty: 0,
  noStrongPenalty: 0,
  totalBonus: 0,
};

const reviewedAlbum = {
  spotifyID: "alb1",
  name: "Old Album",
  reviewScore: 82,
  finalScore: 85,
  reviewBonuses: bonuses,
  bestSong: "Old Best",
  worstSong: "Old Worst",
  reviewContent: "old words",
  genres: ["rock"],
  affectsArtistScore: true,
  artistSpotifyIDs: ["a1"],
  artistScoreIDs: ["a1"],
  albumArtists: [{ spotifyID: "a1", name: "One", imageURLs: [] }],
  colors: [],
} as unknown as Jsonified<ReviewedAlbum>;

const reviewedTracks = [{ spotifyID: "t1", name: "Track One", artistName: "One", artistSpotifyID: "a1", duration: 200000, features: [], rating: 8 }];

const renderForm = (album: Jsonified<SpotifyAlbum | ReviewedAlbum>, tracks?: typeof reviewedTracks) =>
  render(
    <QueryClientProvider client={queryClient}>
      <AlbumReviewForm album={album} tracks={tracks} genres={[]} setSelectedColors={vi.fn()} selectedColors={[]} />
    </QueryClientProvider>
  );

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe("AlbumReviewForm create flow", () => {
  it("starts unrated and shows the live score once tracks are rated", async () => {
    const user = userEvent.setup();
    renderForm(spotifyAlbum);

    expect(screen.getByText("UNRATED")).toBeInTheDocument();

    const selects = screen.getAllByTestId("track-rating-select");
    await user.selectOptions(selects[0], "10");
    await user.selectOptions(selects[1], "10");

    // Two perfect tracks: base 100, capped final score 100
    await waitFor(() => expect(screen.getByText("100")).toBeInTheDocument());
  });

  it("submits a new review through the create endpoint", async () => {
    const user = userEvent.setup();
    createPost.mockResolvedValue(jsonResponse(null, true, 201));
    renderForm(spotifyAlbum);

    await user.type(screen.getByPlaceholderText("Best song..."), "Track One");
    await user.type(screen.getByPlaceholderText("Worst song..."), "Track Two");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(createPost).toHaveBeenCalledTimes(1));

    const payload = createPost.mock.calls[0][0].json;
    expect(payload.album.id).toBe("alb1");
    expect(payload.bestSong).toBe("Track One");
    expect(payload.worstSong).toBe("Track Two");
    expect(payload.affectsArtistScore).toBe(true);
    expect(payload.selectedArtistIDs).toEqual(["a1"]);
    expect(payload.scoreArtistIDs).toEqual(["a1"]);
    expect(payload.ratedTracks).toHaveLength(2);
    expect(payload.ratedTracks[0].rating).toBe(0);
    expect(editPut).not.toHaveBeenCalled();
  });

  it("the solo-album toggle flips affectsArtistScore", async () => {
    const user = userEvent.setup();
    createPost.mockResolvedValue(jsonResponse(null, true, 201));
    renderForm(spotifyAlbum);

    await user.click(screen.getByLabelText("Include in artist score"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(createPost).toHaveBeenCalledTimes(1));
    expect(createPost.mock.calls[0][0].json.affectsArtistScore).toBe(false);
  });
});

describe("AlbumReviewForm edit flow", () => {
  it("prefills the existing review", () => {
    renderForm(reviewedAlbum, reviewedTracks);

    expect(screen.getByPlaceholderText("Best song...")).toHaveValue("Old Best");
    expect(screen.getByPlaceholderText("Worst song...")).toHaveValue("Old Worst");
    expect(screen.getByTestId("review-content-textarea")).toHaveValue("old words");
    // The stored score chip renders alongside the live one
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("submits changes through the edit endpoint", async () => {
    const user = userEvent.setup();
    editPut.mockResolvedValue(jsonResponse(null, true, 200));
    renderForm(reviewedAlbum, reviewedTracks);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(editPut).toHaveBeenCalledTimes(1));

    const call = editPut.mock.calls[0][0];
    expect(call.param).toEqual({ albumID: "alb1" });
    expect(call.json.bestSong).toBe("Old Best");
    expect(call.json.genres).toEqual(["rock"]);
    expect(createPost).not.toHaveBeenCalled();
  });
});
