import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DisplayCurrencyProvider } from "./display-currency-provider";
import { useAnalyticsDashboard } from "./use-analytics-dashboard";

const { fetchAnalyticsCurrencies, fetchAnalyticsDashboardMetrics } = vi.hoisted(() => ({
  fetchAnalyticsCurrencies: vi.fn(),
  fetchAnalyticsDashboardMetrics: vi.fn(),
}));

vi.mock("@/lib/analytics/fetch-analytics-dashboard", () => ({
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
}));

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <DisplayCurrencyProvider>{children}</DisplayCurrencyProvider>;
  };
}

const currenciesResponse = (currencies: string[], exchangeRatesAsOf = "2026-01-01") => ({
  currencies,
  exchangeRatesAsOf,
  ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
});

const metricsResponse = (currency: string) => ({
  summary: {
    currency,
    headcount: currency === "GBP" ? 1 : 3,
    totalPayroll: currency === "GBP" ? 85_000 : 396_000,
    exchangeRatesAsOf: "2026-01-01",
  },
  departmentStatistics: { currency, departments: [], exchangeRatesAsOf: "2026-01-01" },
  topEarners: { currency, earners: [], exchangeRatesAsOf: "2026-01-01" },
});

describe("useAnalyticsDashboard", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("loads analytics data for the selected currency", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD", "GBP"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.summary?.headcount).toBe(3);
    });
    expect(fetchAnalyticsCurrencies).toHaveBeenCalled();
    expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("USD");
    expect(result.current.availableCurrencies).toEqual(["USD", "GBP"]);
    expect(result.current.exchangeRatesAsOf).toBe("2026-01-01");
  });

  it("reloads analytics when display currency changes", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["GBP", "USD"]));
    fetchAnalyticsDashboardMetrics.mockImplementation(async (currency: string) =>
      metricsResponse(currency),
    );

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.summary?.headcount).toBe(3);
    });

    act(() => {
      result.current.selectCurrency("GBP");
    });

    await waitFor(() => {
      expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("GBP");
      expect(result.current.summary?.headcount).toBe(1);
    });
  });

  it("uses the persisted display currency preference", async () => {
    window.localStorage.setItem("acme.displayCurrency", "INR");
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["INR", "USD"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("INR"));

    renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("INR");
    });
  });

  it("surfaces an error message when loading fails", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to load analytics");
    });
  });

  it("ignores late success after the hook unmounts", async () => {
    let resolveMetrics: ((value: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMetrics = resolve;
        }),
    );

    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });
    unmount();
    resolveMetrics?.(metricsResponse("USD"));
  });

  it("ignores late errors after the hook unmounts", async () => {
    let rejectMetrics: ((reason?: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectMetrics = reject;
        }),
    );

    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });
    unmount();
    rejectMetrics?.(new Error("Network error"));
  });

  it("ignores late currency results after the hook unmounts", async () => {
    let resolveCurrencies: ((value: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurrencies = resolve;
        }),
    );
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));

    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });
    unmount();
    resolveCurrencies?.(currenciesResponse(["INR"]));
  });

  it("ignores late currency errors after the hook unmounts", async () => {
    let rejectCurrencies: ((reason?: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCurrencies = reject;
        }),
    );
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));

    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });
    unmount();
    rejectCurrencies?.(new Error("Network error"));
  });

  it("continues when available currencies cannot be loaded", async () => {
    fetchAnalyticsCurrencies.mockRejectedValue(new Error("Network error"));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.availableCurrencies).toEqual([]);
    });
  });
});
