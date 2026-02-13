import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("key", "default"));

    expect(result.current[0]).toBe("default");
  });

  it("returns the stored value if one exists", () => {
    localStorage.setItem("key", JSON.stringify("stored"));

    const { result } = renderHook(() => useLocalStorage("key", "default"));

    expect(result.current[0]).toBe("stored");
  });

  it("updates the value and persists to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("key")!)).toBe("updated");
  });

  it("works with objects", () => {
    const initial = { theme: "dark", lang: "en" };
    const { result } = renderHook(() => useLocalStorage("settings", initial));

    expect(result.current[0]).toEqual(initial);

    act(() => {
      result.current[1]({ theme: "light", lang: "en" });
    });

    expect(result.current[0]).toEqual({ theme: "light", lang: "en" });
  });

  it("falls back to initial value when stored JSON is invalid", () => {
    localStorage.setItem("key", "not valid json{{{");

    const { result } = renderHook(() => useLocalStorage("key", "fallback"));

    expect(result.current[0]).toBe("fallback");
  });
});
