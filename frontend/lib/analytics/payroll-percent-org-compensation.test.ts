import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";
import { describe, expect, it } from "vitest";

import {
  applyDepartmentPayrollPercents,
  resolveOrgTotalPayroll,
  roundDepartmentPayrollPercent,
} from "./analytics-math";
import { buildAnalyticsDashboardView, generateExecutiveInsights } from "./build-analytics-dashboard-view";
import { EMPTY_ANALYTICS_FILTERS, type CompensatedEmployeeRecord } from "./types";

const orgEmployees: CompensatedEmployeeRecord[] = [
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

const orgTotalPayroll = 300_000;

/**
 * Enhance payroll % under analytics filters — compare to org compensation
 *
 * Payroll % always means: (department payroll in the current view) / (total org payroll).
 * KPIs and row averages still reflect the active filter slice.
 */
describe("Enhance payroll % under analytics filters — compare to org compensation", () => {
  describe("resolveOrgTotalPayroll", () => {
    it("uses the sum of all compensated employees as the org denominator", () => {
      expect(resolveOrgTotalPayroll(orgEmployees)).toBe(orgTotalPayroll);
    });

    it("falls back to API summary total when the employee list is empty", () => {
      expect(resolveOrgTotalPayroll([], 999_999)).toBe(999_999);
    });

    it("returns zero when both employees and API summary are unavailable", () => {
      expect(resolveOrgTotalPayroll([], null)).toBe(0);
    });
  });

  describe("roundDepartmentPayrollPercent", () => {
    it("returns zero when payroll or denominator is zero", () => {
      expect(roundDepartmentPayrollPercent(0, orgTotalPayroll)).toBe(0);
      expect(roundDepartmentPayrollPercent(64_366, 0)).toBe(0);
    });

    it("rounds org shares at or above 1% to one decimal", () => {
      expect(roundDepartmentPayrollPercent(200_000, orgTotalPayroll)).toBe(66.7);
      expect(roundDepartmentPayrollPercent(30_000, orgTotalPayroll)).toBe(10);
    });

    it("rounds org shares below 1% to two decimals instead of zero", () => {
      expect(roundDepartmentPayrollPercent(64_366, 160_599_081)).toBe(0.04);
      expect(roundDepartmentPayrollPercent(1_000, orgTotalPayroll)).toBe(0.33);
    });
  });

  describe("applyDepartmentPayrollPercents", () => {
    it("calculates each department share against the org denominator", () => {
      const enriched = applyDepartmentPayrollPercents(
        [
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 100_000,
            medianSalary: 100_000,
            payrollPercent: 0,
          },
          {
            department: "HR",
            employeeCount: 1,
            averageSalary: 60_000,
            medianSalary: 60_000,
            payrollPercent: 0,
          },
        ],
        orgEmployees,
        orgTotalPayroll,
      );

      expect(enriched[0]?.payrollPercent).toBe(66.7);
      expect(enriched[1]?.payrollPercent).toBe(20);
    });

    it("uses filtered employee payroll in the numerator and org total in the denominator", () => {
      const engineeringOnly = orgEmployees.filter(
        (employee) => employee.department === "Engineering",
      );

      const enriched = applyDepartmentPayrollPercents(
        [
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 100_000,
            medianSalary: 100_000,
            payrollPercent: 0,
          },
        ],
        engineeringOnly,
        orgTotalPayroll,
      );

      expect(enriched[0]?.payrollPercent).toBe(66.7);
    });
  });

  describe("buildAnalyticsDashboardView", () => {
    function buildView(
      filters: typeof EMPTY_ANALYTICS_FILTERS,
      employees = orgEmployees,
    ) {
      return buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters,
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees,
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });
    }

    it("keeps unfiltered payroll shares aligned with org compensation", () => {
      const view = buildView(EMPTY_ANALYTICS_FILTERS);

      expect(view.departments.find((row) => row.department === "Engineering")?.payrollPercent).toBe(
        66.7,
      );
      expect(view.departments.find((row) => row.department === "HR")?.payrollPercent).toBe(20);
      expect(view.departments.find((row) => row.department === "Sales")?.payrollPercent).toBe(13.3);
    });

    it("does not show 100% when a department filter leaves one visible row", () => {
      const view = buildView({ country: "", department: "Engineering", jobTitle: "" });

      expect(view.departments).toHaveLength(1);
      expect(view.departments[0]?.payrollPercent).toBe(66.7);
      expect(view.kpis.totalPayroll).toBe(200_000);
    });

    it("does not show 100% when a location filter leaves one visible row", () => {
      const view = buildView({ country: "SG", department: "", jobTitle: "" });

      expect(view.departments).toHaveLength(1);
      expect(view.departments[0]?.payrollPercent).toBe(13.3);
      expect(view.kpis.totalPayroll).toBe(40_000);
    });

    it("does not show 100% when a role filter leaves one visible row", () => {
      const view = buildView({ country: "", department: "", jobTitle: "Engineer" });

      expect(view.departments).toHaveLength(1);
      expect(view.departments[0]?.payrollPercent).toBe(26.7);
      expect(view.kpis.totalPayroll).toBe(80_000);
    });

    it("shows each visible department org share when a role spans multiple departments", () => {
      const coordinatorOrgTotal = 160_599_081;
      const operationsCoordinatorPayroll = 36_800_000;
      const financeCoordinatorPayroll = 64_366;
      const otherOrgPayroll =
        coordinatorOrgTotal - operationsCoordinatorPayroll - financeCoordinatorPayroll;

      const fullWorkforce: CompensatedEmployeeRecord[] = [
        {
          id: "C001",
          fullName: "Ops Coordinator",
          department: "Operations",
          jobTitle: "Coordinator",
          country: "SG",
          displaySalary: operationsCoordinatorPayroll,
        },
        {
          id: "C002",
          fullName: "Finance Coordinator",
          department: "Finance",
          jobTitle: "Coordinator",
          country: "UK",
          displaySalary: financeCoordinatorPayroll,
        },
        {
          id: "F001",
          fullName: "Other Employee",
          department: "Engineering",
          jobTitle: "Engineer",
          country: "US",
          displaySalary: otherOrgPayroll,
        },
      ];

      const view = buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters: { country: "", department: "", jobTitle: "Coordinator" },
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: fullWorkforce,
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });

      expect(view.departments.find((row) => row.department === "Operations")?.payrollPercent).toBe(
        22.9,
      );
      expect(view.departments.find((row) => row.department === "Finance")?.payrollPercent).toBe(
        0.04,
      );
      expect(view.kpis.totalPayroll).toBe(
        operationsCoordinatorPayroll + financeCoordinatorPayroll,
      );
    });

    it("keeps org-share percentages when multiple filters are active", () => {
      const view = buildView({
        country: "IN",
        department: "Engineering",
        jobTitle: "Engineer",
      });

      expect(view.departments).toHaveLength(1);
      expect(view.departments[0]?.payrollPercent).toBe(26.7);
      expect(view.kpis.totalPayroll).toBe(80_000);
    });

    it("uses employee-derived org totals when API summary payroll diverges", () => {
      const view = buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters: EMPTY_ANALYTICS_FILTERS,
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: orgEmployees,
        apiSummary: {
          currency: "USD",
          headcount: 4,
          totalPayroll: 999_999,
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
          ],
        },
        apiTopEarners: {
          currency: "USD",
          exchangeRatesAsOf: "2026-01-01",
          earners: [],
        },
      });

      expect(view.departments[0]?.payrollPercent).toBe(66.7);
    });
  });

  describe("currency change", () => {
    it("keeps payroll % of org stable when display currency changes", () => {
      const gbpScale = 1.25;
      const gbpEmployees = orgEmployees.map((employee) => ({
        ...employee,
        displaySalary: employee.displaySalary * gbpScale,
      }));

      const usdView = buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters: EMPTY_ANALYTICS_FILTERS,
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: orgEmployees,
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });
      const gbpView = buildAnalyticsDashboardView({
        currency: "GBP",
        exchangeRatesAsOf: "2026-01-01",
        filters: EMPTY_ANALYTICS_FILTERS,
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: gbpEmployees,
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });

      for (const department of ["Engineering", "HR", "Sales"] as const) {
        expect(gbpView.departments.find((row) => row.department === department)?.payrollPercent).toBe(
          usdView.departments.find((row) => row.department === department)?.payrollPercent,
        );
      }
    });
  });

  describe("generateExecutiveInsights", () => {
    it("describes payroll contribution as a share of total org payroll", () => {
      const view = buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters: EMPTY_ANALYTICS_FILTERS,
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: orgEmployees,
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });
      const insights = generateExecutiveInsights(view);

      expect(insights[0]).toBe("Engineering contributes 66.7% of total payroll.");
    });

    it("formats small org payroll shares in executive insight copy", () => {
      const view = buildAnalyticsDashboardView({
        currency: "USD",
        exchangeRatesAsOf: "2026-01-01",
        filters: { country: "", department: "Finance", jobTitle: "" },
        ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        employees: [
          {
            id: "F001",
            fullName: "Finance Coordinator",
            department: "Finance",
            jobTitle: "Coordinator",
            country: "UK",
            displaySalary: 64_366,
          },
          {
            id: "E001",
            fullName: "Engineer",
            department: "Engineering",
            jobTitle: "Engineer",
            country: "US",
            displaySalary: 160_534_715,
          },
        ],
        apiSummary: null,
        apiDepartments: null,
        apiTopEarners: null,
      });
      const insights = generateExecutiveInsights(view);

      expect(insights[0]).toBe("Finance contributes 0.04% of total payroll.");
    });
  });
});
