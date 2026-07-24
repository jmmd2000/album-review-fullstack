import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useFieldArray } from "react-hook-form";
import type { Genre, Jsonified } from "@shared/types";
import GenreSelector from "../form/GenreSelector";
import type { CreateReviewFormData } from "../form/AlbumReviewForm";

const knownGenres = [
  { id: 1, name: "Rock", slug: "rock" },
  { id: 2, name: "Pop", slug: "pop" },
] as unknown as Jsonified<Genre>[];

const Harness = ({ initial = [] }: { initial?: { name: string }[] }) => {
  const { control, register, setValue } = useForm<CreateReviewFormData>({ defaultValues: { genres: initial } });
  const { fields, append, remove } = useFieldArray({ control, name: "genres" });
  return <GenreSelector genreFields={fields} register={register} removeGenre={remove} addGenre={append} setValue={setValue} genres={knownGenres} />;
};

describe("GenreSelector", () => {
  it("renders the existing genre pills", () => {
    render(<Harness initial={[{ name: "rock" }, { name: "ambient" }]} />);

    const pills = screen.getAllByPlaceholderText("Enter genre") as HTMLInputElement[];
    expect(pills).toHaveLength(2);
    expect(pills[0].value).toBe("rock");
    expect(pills[1].value).toBe("ambient");
  });

  it("add genre opens an empty pill with the suggestions", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Add Genre"));

    expect(screen.getAllByPlaceholderText("Enter genre")).toHaveLength(1);
    expect(screen.getByText("Rock")).toBeInTheDocument();
    expect(screen.getByText("Pop")).toBeInTheDocument();
  });

  it("typing filters the suggestions", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Add Genre"));
    await user.type(screen.getByPlaceholderText("Enter genre"), "ro");

    expect(screen.getByText("Rock")).toBeInTheDocument();
    expect(screen.queryByText("Pop")).not.toBeInTheDocument();
  });

  it("shows a message when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Add Genre"));
    await user.type(screen.getByPlaceholderText("Enter genre"), "zzz");

    expect(screen.getByText("No matching genres.")).toBeInTheDocument();
  });

  it("clicking a suggestion fills the empty pill", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Add Genre"));
    await user.click(screen.getByText("Rock"));

    const pill = screen.getByPlaceholderText("Enter genre") as HTMLInputElement;
    expect(pill.value).toBe("Rock");
  });

  it("the remove button deletes a pill", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "rock" }, { name: "ambient" }]} />);

    const removeButtons = screen.getAllByRole("button").filter(button => button.textContent === "");
    await user.click(removeButtons[0]);

    const pills = screen.getAllByPlaceholderText("Enter genre") as HTMLInputElement[];
    expect(pills).toHaveLength(1);
    expect(pills[0].value).toBe("ambient");
  });
});
