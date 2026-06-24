import { describe, expect, it, vi } from "vitest";

import {
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
} from "./fetch-analytics-dashboard";

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

describe("fetchAnalyticsCurrencies", () => {
  it("returns currency codes from the analytics API", async () => {
    getAnalyticsCurrencies.mockResolvedValue({ currencies: ["GBP", "INR", "USD"] });

    await expect(fetchAnalyticsCurrencies()).resolves.toEqual(["GBP", "INR", "USD"]);
  });
});

describe("fetchAnalyticsDashboardMetrics", () => {
  it("loads summary, department, and top-earner data in parallel", async () => {
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

    await expect(fetchAnalyticsDashboardMetrics("USD")).resolves.toEqual({
      summary: { currency: "USD", headcount: 3, totalPayroll: 396_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
    });
    expect(getAnalyticsSummary).toHaveBeenCalledWith("USD");
    expect(getDepartmentSalaryStatistics).toHaveBeenCalledWith("USD");
    expect(getTopEarners).toHaveBeenCalledWith("USD");
  });
});
