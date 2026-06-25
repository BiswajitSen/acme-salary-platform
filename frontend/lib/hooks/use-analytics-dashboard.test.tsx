import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clearAnalyticsDashboardCache } from "@/lib/analytics/analytics-dashboard-cache";

import { DisplayCurrencyProvider } from "./display-currency-provider";
import { useAnalyticsDashboard } from "./use-analytics-dashboard";

const {
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
  fetchCompensatedEmployees,
  listEmployeeFilterOptions,
} = vi.hoisted(() => ({
  fetchAnalyticsCurrencies: vi.fn(),
  fetchAnalyticsDashboardMetrics: vi.fn(),
  fetchCompensatedEmployees: vi.fn(),
  listEmployeeFilterOptions: vi.fn(),
}));

vi.mock("@/lib/analytics/fetch-analytics-dashboard", () => ({
  fetchAnalyticsCurrencies,
  fetchAnalyticsDashboardMetrics,
}));

vi.mock("@/lib/analytics/fetch-compensated-employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/analytics/fetch-compensated-employees")>();
  return {
    ...actual,
    fetchCompensatedEmployees,
  };
});

vi.mock("@/lib/api/employees", () => ({
  listEmployeeFilterOptions,
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

const compensatedEmployees = [
  {
    id: "E001",
    fullName: "Jane Doe",
    department: "Engineering",
    jobTitle: "Engineer",
    country: "US",
    baseSalary: 120_000,
    currency: "USD",
    employmentStatus: "ACTIVE" as const,
  },
];

describe("useAnalyticsDashboard", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearAnalyticsDashboardCache();
    vi.clearAllMocks();
  });

  it("loads analytics data for the selected currency", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD", "GBP"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));
    fetchCompensatedEmployees.mockResolvedValue(compensatedEmployees);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Engineer"],
    });

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.view?.kpis.headcount).toBe(3);
    });
    expect(fetchAnalyticsCurrencies).toHaveBeenCalled();
    expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("USD");
    expect(fetchCompensatedEmployees).toHaveBeenCalled();
    expect(result.current.availableCurrencies).toEqual(["USD", "GBP"]);
    expect(result.current.exchangeRatesAsOf).toBe("2026-01-01");
  });

  it("reuses cached analytics data on remount without refetching", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));
    fetchCompensatedEmployees.mockResolvedValue(compensatedEmployees);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

    const wrapper = createWrapper();
    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper });

    await waitFor(() => {
      expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledTimes(1);
    });

    unmount();

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.view?.kpis.headcount).toBe(3);
    });

    expect(fetchAnalyticsCurrencies).toHaveBeenCalledTimes(1);
    expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledTimes(1);
    expect(fetchCompensatedEmployees).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches only metrics when employees are cached and currency changes", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD", "GBP"]));
    fetchAnalyticsDashboardMetrics.mockImplementation(async (currency: string) =>
      metricsResponse(currency),
    );
    fetchCompensatedEmployees.mockResolvedValue(compensatedEmployees);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.view?.kpis.headcount).toBe(3);
    });

    act(() => {
      result.current.selectCurrency("GBP");
    });

    await waitFor(() => {
      expect(result.current.view?.kpis.headcount).toBe(1);
    });

    expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledTimes(2);
    expect(fetchCompensatedEmployees).toHaveBeenCalledTimes(1);
  });

  it("uses the persisted display currency preference", async () => {
    window.localStorage.setItem("acme.displayCurrency", "INR");
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["INR", "USD"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("INR"));
    fetchCompensatedEmployees.mockResolvedValue(compensatedEmployees);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

    renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchAnalyticsDashboardMetrics).toHaveBeenCalledWith("INR");
    });
  });

  it("surfaces an error message when loading fails", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockRejectedValue(new Error("Network error"));
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

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
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

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
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

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
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

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
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

    const { unmount } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });
    unmount();
    rejectCurrencies?.(new Error("Network error"));
  });

  it("continues when available currencies cannot be loaded", async () => {
    fetchAnalyticsCurrencies.mockRejectedValue(new Error("Network error"));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));
    fetchCompensatedEmployees.mockResolvedValue([]);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.availableCurrencies).toEqual([]);
    });
  });

  it("updates and resets dashboard filters", async () => {
    fetchAnalyticsCurrencies.mockResolvedValue(currenciesResponse(["USD"]));
    fetchAnalyticsDashboardMetrics.mockResolvedValue(metricsResponse("USD"));
    fetchCompensatedEmployees.mockResolvedValue(compensatedEmployees);
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: ["Engineering"],
      jobTitles: [],
    });

    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.view?.kpis.headcount).toBe(3);
    });

    act(() => {
      result.current.setFilter("department", "Engineering");
    });

    expect(result.current.filters.department).toBe("Engineering");

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({
      country: "",
      department: "",
      jobTitle: "",
    });
  });
});
