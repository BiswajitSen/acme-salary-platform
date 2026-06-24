import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 300));

    expect(result.current).toBe("initial");
  });

  it("updates after the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      { initialProps: { value: "first", delayMs: 300 } },
    );

    rerender({ value: "second", delayMs: 300 });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("second");
  });
});
