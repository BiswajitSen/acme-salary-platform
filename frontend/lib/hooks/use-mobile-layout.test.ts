import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMobileLayout } from "./use-mobile-layout";

function mockMatchMedia(matches: boolean) {
  const listeners = new Map<string, Set<() => void>>();

  const mediaQueryList = {
    matches,
    media: "(max-width: 960px)",
    addEventListener: (event: string, listener: () => void) => {
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
    },
    removeEventListener: (event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener);
    },
    dispatchChange: () => {
      for (const listener of listeners.get("change") ?? []) {
        listener();
      }
    },
  };

  vi.spyOn(window, "matchMedia").mockImplementation(
    () => mediaQueryList as unknown as MediaQueryList,
  );

  return mediaQueryList;
}

describe("useMobileLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the viewport is wider than the mobile breakpoint", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current).toBe(false);
  });

  it("returns true when the viewport matches the mobile breakpoint", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current).toBe(true);
  });

  it("subscribes to viewport changes and cleans up on unmount", () => {
    const mediaQueryList = mockMatchMedia(false);
    const addEventListener = vi.spyOn(mediaQueryList, "addEventListener");
    const removeEventListener = vi.spyOn(mediaQueryList, "removeEventListener");

    const { unmount } = renderHook(() => useMobileLayout());

    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
