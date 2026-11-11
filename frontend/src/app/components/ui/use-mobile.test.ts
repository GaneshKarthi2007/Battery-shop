import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  }

  afterEach(() => {
    setViewportWidth(originalWidth);
    (window as any).matchMedia = originalMatchMedia;
  });

  it("returns true below 768px and false at or above it, without matchMedia", () => {
    (window as any).matchMedia = undefined;
    setViewportWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1024);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(false);
  });

  it("subscribes to matchMedia change events when available", () => {
    const listeners: Array<() => void> = [];
    (window as any).matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
    });
    setViewportWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(360);
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});
