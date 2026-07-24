import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ReviewContentInput } from "@/components/form/ReviewContentInput";
import type { CreateReviewFormData } from "@/components/form/AlbumReviewForm";

vi.mock("sonner", () => ({
  toast: { info: vi.fn() },
}));

const Harness = ({ value = "" }: { value?: string }) => {
  const { register } = useForm<CreateReviewFormData>({ defaultValues: { reviewContent: value } });
  return <ReviewContentInput registration={register("reviewContent")} value={value} />;
};

const textarea = () => screen.getByTestId("review-content-textarea") as HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReviewContentInput", () => {
  it("renders the existing content", () => {
    render(<Harness value="a fine record" />);

    expect(textarea().value).toBe("a fine record");
  });

  it("asks for a selection before formatting", async () => {
    const user = userEvent.setup();
    render(<Harness value="a fine record" />);

    await user.click(screen.getByTitle("Bold"));

    expect(toast.info).toHaveBeenCalledWith("Please select some text first");
    expect(textarea().value).toBe("a fine record");
  });

  it("wraps the selection in bold markers", async () => {
    const user = userEvent.setup();
    render(<Harness value="a fine record" />);

    textarea().setSelectionRange(2, 6);
    await user.click(screen.getByTitle("Bold"));

    expect(textarea().value).toBe("a **fine** record");
  });

  it("wraps the selection in italic and underline markers", async () => {
    const user = userEvent.setup();
    render(<Harness value="a fine record" />);

    textarea().setSelectionRange(2, 6);
    await user.click(screen.getByTitle("Italic"));
    expect(textarea().value).toBe("a *fine* record");

    textarea().setSelectionRange(3, 7);
    await user.click(screen.getByTitle("Underline"));
    expect(textarea().value).toBe("a *__fine__* record");
  });

  it("wraps the selection in colour markers", async () => {
    const user = userEvent.setup();
    render(<Harness value="a fine record" />);

    textarea().setSelectionRange(2, 6);
    await user.click(screen.getByTitle("Red Text"));

    expect(textarea().value).toBe("a {color:#fb2c36}fine{color} record");
  });
});
