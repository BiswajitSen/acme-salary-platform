import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAnalyticsDashboard } from "./use-analytics-dashboard";

const { getAnalyticsSummary, getDepartmentSalaryStatistics, getTopEarners } = vi.hoisted(
  () => ({
    getAnalyticsSummary: vi.fn(),
    getDepartmentSalaryStatistics: vi.fn(),
    getTopEarners: vi.fn(),
  }),
);

vi.mock("@/lib/api/analytics", () => ({
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
}));

describe("useAnalyticsDashboard", () => {
  it("loads analytics data for the selected currency", async () => {
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
    expect(getAnalyticsSummary).toHaveBeenCalledWith("USD");
  });

  it("reloads analytics when currency changes", async () => {
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

  it("surfaces an error message when loading fails", async () => {
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
});
