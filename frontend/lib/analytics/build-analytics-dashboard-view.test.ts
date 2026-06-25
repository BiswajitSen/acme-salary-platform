import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";
import { describe, expect, it } from "vitest";

import {
  buildAnalyticsDashboardView,
  filterCompensatedEmployees,
  generateExecutiveInsights,
  hasActiveAnalyticsFilters,
} from "./build-analytics-dashboard-view";
import { EMPTY_ANALYTICS_FILTERS, type CompensatedEmployeeRecord } from "./types";
import { verifyAnalyticsDashboardView } from "./verify-analytics-dashboard-view";

const employees: CompensatedEmployeeRecord[] = [
  {
    id: "E001",
    fullName: "Jane Doe",
    department: "Engineering",
    jobTitle: "Senior Engineer",
    country: "US",
    displaySalary: 120_000,
  },
  {
    id: "E002",
    fullName: "Bob Smith",
    department: "Engineering",
    jobTitle: "Engineer",
    country: "IN",
    displaySalary: 80_000,
  },
  {
    id: "E003",
    fullName: "Priya Patel",
    department: "HR",
    jobTitle: "HR Manager",
    country: "IN",
    displaySalary: 60_000,
  },
  {
    id: "E004",
    fullName: "Sam Lee",
    department: "Sales",
    jobTitle: "Account Executive",
    country: "SG",
    displaySalary: 40_000,
  },
];

function buildClientOnlyView(filteredEmployees = employees) {
  return buildAnalyticsDashboardView({
    currency: "USD",
    exchangeRatesAsOf: "2026-01-01",
    filters: EMPTY_ANALYTICS_FILTERS,
    ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
    employees: filteredEmployees,
    apiSummary: null,
    apiDepartments: null,
    apiTopEarners: null,
  });
}

describe("buildAnalyticsDashboardView", () => {
  it("uses API aggregates when no filters are active", () => {
    const view = buildAnalyticsDashboardView({
      currency: "USD",
      exchangeRatesAsOf: "2026-01-01",
      filters: EMPTY_ANALYTICS_FILTERS,
      ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
      employees,
      apiSummary: {
        currency: "USD",
        headcount: 4,
        totalPayroll: 300_000,
        exchangeRatesAsOf: "2026-01-01",
      },
      apiDepartments: {
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        departments: [
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 100_000,
            medianSalary: 100_000,
          },
          {
            department: "HR",
            employeeCount: 1,
            averageSalary: 60_000,
            medianSalary: 60_000,
          },
          {
            department: "Sales",
            employeeCount: 1,
            averageSalary: 40_000,
            medianSalary: 40_000,
          },
        ],
      },
      apiTopEarners: {
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        earners: [
          {
            employeeId: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            baseSalary: 120_000,
          },
          {
            employeeId: "E002",
            fullName: "Bob Smith",
            department: "Engineering",
            baseSalary: 80_000,
          },
        ],
      },
    });

    expect(view.kpis.headcount).toBe(4);
    expect(view.kpis.totalPayroll).toBe(300_000);
    expect(view.kpis.averageSalary).toBe(75_000);
    expect(view.kpis.highestPaidLocation?.name).toBe("USA");
    expect(view.highlights.topTenPayrollPercent).toBe(100);
    expect(view.departments.find((department) => department.department === "Engineering")?.payrollPercent).toBe(66.7);
    expect(verifyAnalyticsDashboardView(view, employees)).toEqual([]);
  });

  it("recomputes metrics from filtered employees when filters are active", () => {
    const view = buildAnalyticsDashboardView({
      currency: "USD",
      exchangeRatesAsOf: "2026-01-01",
      filters: { country: "IN", department: "", jobTitle: "" },
      ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
      employees,
      apiSummary: {
        currency: "USD",
        headcount: 4,
        totalPayroll: 300_000,
        exchangeRatesAsOf: "2026-01-01",
      },
      apiDepartments: {
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        departments: [],
      },
      apiTopEarners: {
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        earners: [],
      },
    });

    expect(view.kpis.headcount).toBe(2);
    expect(view.kpis.totalPayroll).toBe(140_000);
    expect(view.topEarners).toHaveLength(2);
    expect(verifyAnalyticsDashboardView(view, filterCompensatedEmployees(employees, {
      country: "IN",
      department: "",
      jobTitle: "",
    }))).toEqual([]);
  });

  it("keeps payroll concentration visible for large uniform workforces", () => {
    const uniformEmployees = Array.from({ length: 10_000 }, (_, index) => ({
      id: `E${String(index + 1).padStart(5, "0")}`,
      fullName: `Employee ${index + 1}`,
      department: "Engineering",
      jobTitle: "Engineer",
      country: "US",
      displaySalary: 100_000,
    }));

    const view = buildClientOnlyView(uniformEmployees);

    expect(view.highlights.topTenPayrollPercent).toBe(0.1);
    expect(view.histogram).toHaveLength(1);
    expect(view.histogram[0]?.count).toBe(10_000);
    expect(verifyAnalyticsDashboardView(view, uniformEmployees)).toEqual([]);
  });

  it("keeps derived metrics internally consistent for varied client data", () => {
    const view = buildClientOnlyView();

    expect(view.kpis.totalPayroll).toBe(300_000);
    expect(view.kpis.medianSalary).toBe(70_000);
    expect(view.highlights.aboveMedian + view.highlights.belowMedian + view.highlights.atMedian).toBe(4);
    expect(view.histogram.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(4);
    expect(view.insights[0]).toContain("Engineering contributes");
    expect(verifyAnalyticsDashboardView(view, employees)).toEqual([]);
  });
});

describe("filterCompensatedEmployees", () => {
  it("filters by department and role", () => {
    const filtered = filterCompensatedEmployees(employees, {
      country: "",
      department: "Engineering",
      jobTitle: "Engineer",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("E002");
  });
});

describe("hasActiveAnalyticsFilters", () => {
  it("detects active filters", () => {
    expect(hasActiveAnalyticsFilters(EMPTY_ANALYTICS_FILTERS)).toBe(false);
    expect(
      hasActiveAnalyticsFilters({ country: "IN", department: "", jobTitle: "" }),
    ).toBe(true);
  });
});

describe("generateExecutiveInsights", () => {
  it("references the highest payroll department and aligned median split", () => {
    const view = buildClientOnlyView();
    const insights = generateExecutiveInsights(view);

    expect(insights.some((insight) => insight.includes("contributes"))).toBe(true);
    expect(insights.some((insight) => insight.includes("above the org median"))).toBe(true);
    expect(insights.some((insight) => insight.includes("Top 10 employees account for"))).toBe(true);
  });
});
