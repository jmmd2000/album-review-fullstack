import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtistSelector from "../form/ArtistSelector";

const albumArtists = [
  { spotifyID: "a1", name: "Drake", imageURLs: [] },
  { spotifyID: "a2", name: "21 Savage", imageURLs: [] },
];

describe("ArtistSelector", () => {
  it("renders nothing for a solo album", () => {
    const { container } = render(<ArtistSelector albumArtists={[albumArtists[0]]} watchedArtists={["a1"]} watchedScoreArtists={["a1"]} setValue={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("unchecking an artist removes them from both lists", async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();
    render(<ArtistSelector albumArtists={albumArtists} watchedArtists={["a1", "a2"]} watchedScoreArtists={["a1", "a2"]} setValue={setValue} />);

    // Checkboxes come in pairs per artist, the selection box first and the score box second
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]);

    expect(setValue).toHaveBeenCalledWith("selectedArtistIDs", ["a1"], { shouldDirty: true });
    expect(setValue).toHaveBeenCalledWith("scoreArtistIDs", ["a1"], { shouldDirty: true });
  });

  it("keeps at least one artist selected", async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();
    render(<ArtistSelector albumArtists={albumArtists} watchedArtists={["a1"]} watchedScoreArtists={["a1"]} setValue={setValue} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(setValue).not.toHaveBeenCalled();
  });

  it("re-checking an artist adds them back to both lists", async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();
    render(<ArtistSelector albumArtists={albumArtists} watchedArtists={["a1"]} watchedScoreArtists={["a1"]} setValue={setValue} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]);

    expect(setValue).toHaveBeenCalledWith("selectedArtistIDs", ["a1", "a2"], { shouldDirty: true });
    expect(setValue).toHaveBeenCalledWith("scoreArtistIDs", ["a1", "a2"], { shouldDirty: true });
  });

  it("the score checkbox toggles only the score list", async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();
    render(<ArtistSelector albumArtists={albumArtists} watchedArtists={["a1", "a2"]} watchedScoreArtists={["a1", "a2"]} setValue={setValue} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[3]);

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith("scoreArtistIDs", ["a1"], { shouldDirty: true });
  });

  it("disables the score checkbox for an unselected artist", () => {
    render(<ArtistSelector albumArtists={albumArtists} watchedArtists={["a1"]} watchedScoreArtists={["a1"]} setValue={vi.fn()} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[3]).toBeDisabled();
  });
});
