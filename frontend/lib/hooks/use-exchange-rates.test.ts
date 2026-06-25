import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { useExchangeRates } from "./use-exchange-rates";

const { getAnalyticsCurrenciesMock } = vi.hoisted(() => ({
  getAnalyticsCurrenciesMock: vi.fn(),
}));

vi.mock("@/lib/api/analytics", () => ({
  getAnalyticsCurrencies: (...args: unknown[]) => getAnalyticsCurrenciesMock(...args),
}));

describe("useExchangeRates", () => {
  it("loads exchange rates from the analytics API", async () => {
    getAnalyticsCurrenciesMock.mockResolvedValue({
      currencies: ["USD", "INR"],
      exchangeRatesAsOf: "2026-01-01",
      ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
    });

    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => {
      expect(result.current.ratesToUsd).toEqual(TEST_EXCHANGE_RATES_TO_USD);
    });
    expect(result.current.exchangeRatesAsOf).toBe("2026-01-01");
  });

  it("returns null rates when loading fails", async () => {
    getAnalyticsCurrenciesMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.ratesToUsd).toBeNull();
  });

  it("ignores late exchange rate results after the hook unmounts", async () => {
    let resolveCurrencies: ((value: unknown) => void) | undefined;

    getAnalyticsCurrenciesMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurrencies = resolve;
        }),
    );

    const { unmount } = renderHook(() => useExchangeRates());
    unmount();
    resolveCurrencies?.({
      currencies: ["USD"],
      exchangeRatesAsOf: "2026-01-01",
      ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
    });
  });
});
