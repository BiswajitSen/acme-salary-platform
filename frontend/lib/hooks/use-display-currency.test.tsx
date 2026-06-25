import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DisplayCurrencyProvider,
  useDisplayCurrency,
} from "./display-currency-provider";

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <DisplayCurrencyProvider>{children}</DisplayCurrencyProvider>;
  };
}

describe("useDisplayCurrency", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to USD when no preference is stored", async () => {
    const { result } = renderHook(() => useDisplayCurrency(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currency).toBe("USD");
  });

  it("restores a saved display currency preference", async () => {
    window.localStorage.setItem("acme.displayCurrency", "GBP");

    const { result } = renderHook(() => useDisplayCurrency(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currency).toBe("GBP");
    expect(result.current.isReady).toBe(true);
  });

  it("persists the selected display currency", async () => {
    const { result } = renderHook(() => useDisplayCurrency(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.selectCurrency("inr");
    });

    expect(result.current.currency).toBe("INR");
    expect(window.localStorage.getItem("acme.displayCurrency")).toBe("INR");
  });

  it("throws when used outside DisplayCurrencyProvider", () => {
    expect(() => renderHook(() => useDisplayCurrency())).toThrow(
      "useDisplayCurrency must be used within DisplayCurrencyProvider",
    );
  });

  it("updates every consumer when the header changes display currency", async () => {
    function useHeaderAndPageCurrency() {
      const header = useDisplayCurrency();
      const page = useDisplayCurrency();

      return { header, page };
    }

    const { result } = renderHook(() => useHeaderAndPageCurrency(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.header.selectCurrency("GBP");
    });

    expect(result.current.header.currency).toBe("GBP");
    expect(result.current.page.currency).toBe("GBP");
  });
});
