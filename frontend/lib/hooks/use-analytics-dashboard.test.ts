import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAnalyticsDashboard } from "./use-analytics-dashboard";

const { fetchAnalyticsCurrencies, fetchAnalyticsDashboardMetrics } = vi.hoisted(() => ({
  fetchAnalyticsCurrencies: vi.fn(),
  fetchAnalyticsDashboardMetrics: vi.fn(),
}));

vi.mock("@/lib/analytics/fetch-analytics-dashboard", () => ({
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
}));

describe("useAnalyticsDashboard", () => {
  it("loads analytics data for the selected currency", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(["USD"]);
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "USD", headcount: 3, totalPayroll: 396_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.summary?.headcount).toBe(3);
    });
    expect(fetchAnalyticsCurrencies).toHaveBeenCalled();
    expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("USD");
    expect(result.current.availableCurrencies).toEqual(["USD"]);
  });

  it("reloads analytics when currency changes", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(["GBP", "USD"]);
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "GBP", headcount: 1, totalPayroll: 85_000 },
      departmentStatistics: { currency: "GBP", departments: [] },
      topEarners: { currency: "GBP", earners: [] },
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    result.current.selectCurrency("GBP");

    await waitFor(() => {
      expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("GBP");
    });
  });

  it("selects the first available currency when the default is missing", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(["INR"]);
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "INR", headcount: 1, totalPayroll: 96_199 },
      departmentStatistics: { currency: "INR", departments: [] },
      topEarners: { currency: "INR", earners: [] },
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.currency).toBe("INR");
    });
  });

  it("surfaces an error message when loading fails", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(["USD"]);
    fetchAnalyticsDashboardMetrics.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to load analytics");
    });
  });

  it("ignores late success after the hook unmounts", async () => {
    let resolveMetrics: ((value: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockResolvedValue(["USD"]);
    fetchAnalyticsDashboardMetrics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMetrics = resolve;
        }),
    );

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    resolveMetrics?.({
      summary: { currency: "USD", headcount: 1, totalPayroll: 100_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });
  });

  it("ignores late errors after the hook unmounts", async () => {
    let rejectMetrics: ((reason?: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockResolvedValue(["USD"]);
    fetchAnalyticsDashboardMetrics.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectMetrics = reject;
        }),
    );

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
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
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "USD", headcount: 1, totalPayroll: 100_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    resolveCurrencies?.(["INR"]);
  });

  it("ignores late currency errors after the hook unmounts", async () => {
    let rejectCurrencies: ((reason?: unknown) => void) | undefined;

    fetchAnalyticsCurrencies.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCurrencies = reject;
        }),
    );
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "USD", headcount: 1, totalPayroll: 100_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    rejectCurrencies?.(new Error("Network error"));
  });

  it("continues when available currencies cannot be loaded", async () => {
    fetchAnalyticsCurrencies.mockRejectedValue(new Error("Network error"));
    fetchAnalyticsDashboardMetrics.mockResolvedValue({
      summary: { currency: "USD", headcount: 1, totalPayroll: 100_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.availableCurrencies).toEqual([]);
    });
  });
});
