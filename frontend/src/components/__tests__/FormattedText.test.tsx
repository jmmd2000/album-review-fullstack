import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/__tests__/test-utils";
import { FormattedText } from "@components/ui/FormattedText";
import { FormattedToken } from "@shared/helpers/parseReviewContent";

describe("FormattedText", () => {
  it("renders plain text tokens", async () => {
    const tokens: FormattedToken[] = [{ type: "text", content: "Hello world" }];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold tokens as <strong>", async () => {
    const tokens: FormattedToken[] = [{ type: "bold", content: "Important" }];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    const el = screen.getByText("Important");
    expect(el.tagName).toBe("STRONG");
  });

  it("renders italic tokens as <em>", async () => {
    const tokens: FormattedToken[] = [{ type: "italic", content: "Emphasis" }];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    const el = screen.getByText("Emphasis");
    expect(el.tagName).toBe("EM");
  });

  it("renders underline tokens as <u>", async () => {
    const tokens: FormattedToken[] = [{ type: "underline", content: "Underlined" }];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    const el = screen.getByText("Underlined");
    expect(el.tagName).toBe("U");
  });

  it("renders colored tokens with inline color style", async () => {
    const tokens: FormattedToken[] = [{ type: "colored", content: "Red text", color: "#ff0000" }];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    const el = screen.getByText("Red text");
    expect(el).toHaveStyle({ color: "#ff0000", fontWeight: 700 });
  });

  it("renders mixed tokens in order", async () => {
    const tokens: FormattedToken[] = [
      { type: "text", content: "Start " },
      { type: "bold", content: "middle" },
      { type: "text", content: " end" },
    ];
    await renderWithProviders(<FormattedText tokens={tokens} />);

    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("middle")).toBeInTheDocument();
    expect(screen.getByText("end")).toBeInTheDocument();
  });
});
