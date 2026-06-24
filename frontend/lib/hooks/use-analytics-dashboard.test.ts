import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAnalyticsDashboard } from "./use-analytics-dashboard";

const {
  getAnalyticsCurrencies,
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
} = vi.hoisted(() => ({
  getAnalyticsCurrencies: vi.fn(),
  getAnalyticsSummary: vi.fn(),
  getDepartmentSalaryStatistics: vi.fn(),
  getTopEarners: vi.fn(),
}));

vi.mock("@/lib/api/analytics", () => ({
  getAnalyticsCurrencies,
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
}));

describe("useAnalyticsDashboard", () => {
  it("loads analytics data for the selected currency", async () => {
    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["USD"] });
    getAnalyticsSummary.mockResolvedValue({
      currency: "USD",
      headcount: 3,
      totalPayroll: 396_000,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.summary?.headcount).toBe(3);
    });
    expect(getAnalyticsCurrencies).toHaveBeenCalled();
    expect(getAnalyticsSummary).toHaveBeenCalledWith("USD");
    expect(result.current.availableCurrencies).toEqual(["USD"]);
  });

  it("reloads analytics when currency changes", async () => {
    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["GBP", "USD"] });
    getAnalyticsSummary.mockResolvedValue({
      currency: "GBP",
      headcount: 1,
      totalPayroll: 85_000,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "GBP",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "GBP",
      earners: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    result.current.selectCurrency("GBP");

    await waitFor(() => {
      expect(getAnalyticsSummary).toHaveBeenCalledWith("GBP");
    });
  });

  it("selects the first available currency when the default is missing", async () => {
    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["INR"] });
    getAnalyticsSummary.mockResolvedValue({
      currency: "INR",
      headcount: 1,
      totalPayroll: 96_199,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "INR",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "INR",
      earners: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.currency).toBe("INR");
    });
  });

  it("surfaces an error message when loading fails", async () => {
    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["USD"] });
    getAnalyticsSummary.mockRejectedValue(new Error("Network error"));
    getDepartmentSalaryStatistics.mockRejectedValue(new Error("Network error"));
    getTopEarners.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to load analytics");
    });
  });

  it("ignores late success after the hook unmounts", async () => {
    let resolveSummary: ((value: unknown) => void) | undefined;

    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["USD"] });
    getAnalyticsSummary.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSummary = resolve;
        }),
    );
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    resolveSummary?.({
      currency: "USD",
      headcount: 1,
      totalPayroll: 100_000,
    });
  });

  it("ignores late errors after the hook unmounts", async () => {
    let rejectSummary: ((reason?: unknown) => void) | undefined;

    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["USD"] });
    getAnalyticsSummary.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectSummary = reject;
        }),
    );
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    rejectSummary?.(new Error("Network error"));
  });

  it("ignores late currency results after the hook unmounts", async () => {
    let resolveCurrencies: ((value: unknown) => void) | undefined;

    getAnalyticsCurrencies.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurrencies = resolve;
        }),
    );
    getAnalyticsSummary.mockResolvedValue({
      currency: "USD",
      headcount: 1,
      totalPayroll: 100_000,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    resolveCurrencies?.({ currencies: ["INR"] });
  });

  it("ignores late currency errors after the hook unmounts", async () => {
    let rejectCurrencies: ((reason?: unknown) => void) | undefined;

    getAnalyticsCurrencies.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCurrencies = reject;
        }),
    );
    getAnalyticsSummary.mockResolvedValue({
      currency: "USD",
      headcount: 1,
      totalPayroll: 100_000,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard("USD"));
    unmount();
    rejectCurrencies?.(new Error("Network error"));
  });

  it("continues when available currencies cannot be loaded", async () => {
    getAnalyticsCurrencies.mockRejectedValue(new Error("Network error"));
    getAnalyticsSummary.mockResolvedValue({
      currency: "USD",
      headcount: 1,
      totalPayroll: 100_000,
    });
    getDepartmentSalaryStatistics.mockResolvedValue({
      currency: "USD",
      departments: [],
    });
    getTopEarners.mockResolvedValue({
      currency: "USD",
      earners: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard("USD"));

    await waitFor(() => {
      expect(result.current.availableCurrencies).toEqual([]);
    });
  });
});
