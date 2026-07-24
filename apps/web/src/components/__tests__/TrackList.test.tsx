import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import type { DisplayTrack } from "@shared/types";
import TrackList from "../track/TrackList";
import type { CreateReviewFormData } from "../form/AlbumReviewForm";

const track = (id: string, name: string, rating?: number): DisplayTrack => ({
  spotifyID: id,
  artistSpotifyID: "a1",
  artistName: "The Artist",
  name,
  duration: 200000,
  features: [],
  rating,
});

const FormHarness = ({ tracks }: { tracks: DisplayTrack[] }) => {
  const { control, register, setValue } = useForm<CreateReviewFormData>({ defaultValues: { tracks } });
  return <TrackList tracks={tracks} formMethods={{ control, register, setValue }} />;
};

describe("TrackList", () => {
  it("renders each track with its number and duration", () => {
    render(<TrackList tracks={[track("t1", "Opener", 8), track("t2", "Closer", 6)]} />);

    expect(screen.getByText("Opener")).toBeInTheDocument();
    expect(screen.getByText("Closer")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("3:20")).toHaveLength(2);
  });

  it("groups tracks under tier headings when sorted by rating", () => {
    render(<TrackList tracks={[track("t1", "Opener", 10), track("t2", "Closer", 8)]} sortByRating />);

    // One tier heading per rating, each holding a single track
    expect(screen.getAllByText("(1)")).toHaveLength(2);
    expect(screen.getAllByText("Perfect").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brilliant").length).toBeGreaterThan(0);
    expect(screen.getByText("Opener")).toBeInTheDocument();
    expect(screen.getByText("Closer")).toBeInTheDocument();
  });

  it("renders a rating select per track in form mode", () => {
    render(<FormHarness tracks={[track("t1", "Opener", 0), track("t2", "Closer", 0)]} />);

    expect(screen.getAllByTestId("track-rating-select")).toHaveLength(2);
  });

  it("changing a rating updates the select", async () => {
    const user = userEvent.setup();
    render(<FormHarness tracks={[track("t1", "Opener", 0)]} />);

    const select = screen.getByTestId("track-rating-select") as HTMLSelectElement;
    await user.selectOptions(select, "7");

    expect(select.value).toBe("7");
  });
});
