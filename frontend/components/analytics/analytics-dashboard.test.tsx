import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsDashboard } from "./analytics-dashboard";

const { useAnalyticsDashboardMock } = vi.hoisted(() => ({
  useAnalyticsDashboardMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-analytics-dashboard", () => ({
  useAnalyticsDashboard: (...args: unknown[]) => useAnalyticsDashboardMock(...args),
}));

const dashboardView = {
  currency: "INR",
  exchangeRatesAsOf: "2026-01-01",
  kpis: {
    headcount: 3,
    totalPayroll: 396_000,
    averageSalary: 132_000,
    medianSalary: 120_000,
    highestPaidDepartment: { name: "Operations", averageSalary: 150_000 },
    highestPaidLocation: { name: "India", averageSalary: 140_000 },
  },
  departments: [
    {
      department: "Operations",
      employeeCount: 2,
      averageSalary: 96_000,
      medianSalary: 96_000,
      payrollPercent: 48,
    },
  ],
  locations: [
    {
      country: "IN",
      label: "India",
      payroll: 250_000,
      employeeCount: 2,
      averageSalary: 125_000,
    },
  ],
  roles: [{ jobTitle: "Manager", averageSalary: 96_000, employeeCount: 1 }],
  headcountByDepartment: [{ department: "Operations", count: 2, percent: 100 }],
  topEarners: [
    {
      employeeId: "E00005",
      fullName: "Employee 5",
      department: "Operations",
      country: "IN",
      baseSalary: 96_199,
    },
  ],
  histogram: [{ label: "₹50,000–₹100,000", count: 2 }],
  heatmap: {
    countries: ["IN"],
    departments: ["Operations"],
    cells: [{ country: "IN", department: "Operations", averageSalary: 96_000 }],
  },
  insights: ["Operations contributes 48% of total payroll."],
  highlights: {
    highestSalary: { amount: 96_199, employeeId: "E00005" },
    lowestSalary: { amount: 80_000, employeeId: "E00006" },
    topTenPayrollPercent: 25,
    salaryRange: { min: 80_000, max: 96_199 },
    aboveMedian: 1,
    belowMedian: 1,
    atMedian: 0,
    averageEmployeesPerDepartment: 2,
  },
};

describe("AnalyticsDashboard", () => {
  afterEach(() => {
    cleanup();
    useAnalyticsDashboardMock.mockReset();
  });

  it("renders executive dashboard sections when data is loaded", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "INR",
      availableCurrencies: ["INR", "USD"],
      exchangeRatesAsOf: "2026-01-01",
      filterOptions: { countries: ["IN"], departments: ["Operations"], jobTitles: ["Manager"] },
      filters: { country: "", department: "", jobTitle: "" },
      view: dashboardView,
      isLoading: false,
      isRefreshing: false,
      errorMessage: null,
      selectCurrency: vi.fn(),
      setFilter: vi.fn(),
      resetFilters: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Analytics Dashboard")).toBeTruthy();
    expect(screen.getByText("Total Employees")).toBeTruthy();
    expect(screen.getByText("Total Payroll")).toBeTruthy();
    expect(screen.getByText("Payroll by department")).toBeTruthy();
    expect(screen.getByText("Top earners")).toBeTruthy();
    expect(screen.getByText("Executive insights")).toBeTruthy();
    expect(screen.getByText("Employee 5")).toBeTruthy();
    expect(
      screen.getByText(
        "All salary and payroll figures reflect annual base compensation in the selected display currency.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("FX rates as of 2026-01-01")).toBeTruthy();
  });

  it("shows a loading state while analytics data is fetched", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      availableCurrencies: [],
      exchangeRatesAsOf: null,
      filterOptions: { countries: [], departments: [], jobTitles: [] },
      filters: { country: "", department: "", jobTitle: "" },
      view: null,
      isLoading: true,
      isRefreshing: false,
      errorMessage: null,
      selectCurrency: vi.fn(),
      setFilter: vi.fn(),
      resetFilters: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Loading analytics…")).toBeTruthy();
  });

  it("shows an empty state when no currencies are available", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      availableCurrencies: [],
      exchangeRatesAsOf: null,
      filterOptions: { countries: [], departments: [], jobTitles: [] },
      filters: { country: "", department: "", jobTitle: "" },
      view: null,
      isLoading: false,
      isRefreshing: false,
      errorMessage: null,
      selectCurrency: vi.fn(),
      setFilter: vi.fn(),
      resetFilters: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(
      screen.getByText("No compensation data is available for analytics yet."),
    ).toBeTruthy();
  });

  it("shows an error alert when loading fails", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      availableCurrencies: ["USD"],
      exchangeRatesAsOf: "2026-01-01",
      filterOptions: { countries: [], departments: [], jobTitles: [] },
      filters: { country: "", department: "", jobTitle: "" },
      view: null,
      isLoading: false,
      errorMessage: "Unable to load analytics dashboard data.",
      selectCurrency: vi.fn(),
      setFilter: vi.fn(),
      resetFilters: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Unable to load analytics dashboard data.")).toBeTruthy();
  });
});
