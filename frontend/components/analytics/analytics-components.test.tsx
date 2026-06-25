import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnalyticsDepartmentPayrollSection } from "./analytics-department-payroll-section";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { AnalyticsTopEarnersList } from "./analytics-top-earners-list";

describe("AnalyticsKpiCards", () => {
  it("renders six executive KPI metrics", () => {
    render(
      <AnalyticsKpiCards
        currency="USD"
        kpis={{
          headcount: 42,
          totalPayroll: 5_000_000,
          averageSalary: 119_000,
          medianSalary: 115_000,
          highestPaidDepartment: { name: "Engineering", averageSalary: 140_000 },
          highestPaidLocation: { name: "Singapore", averageSalary: 160_000 },
        }}
      />,
    );

    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("$5,000,000")).toBeTruthy();
    expect(screen.getByText("Total Employees")).toBeTruthy();
    expect(screen.getByText("Median Salary")).toBeTruthy();
    expect(screen.getByText("Engineering")).toBeTruthy();
    expect(screen.getByText("Singapore")).toBeTruthy();
  });
});

describe("AnalyticsDepartmentPayrollSection", () => {
  it("renders department salary statistics", () => {
    render(
      <AnalyticsDepartmentPayrollSection
        currency="USD"
        departments={[
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 120_000,
            medianSalary: 115_000,
            payrollPercent: 60,
          },
        ]}
      />,
    );

    expect(screen.getByText("Engineering")).toBeTruthy();
    expect(screen.getByText("$120,000")).toBeTruthy();
    expect(screen.getByText("$115,000")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
  });
});

describe("AnalyticsTopEarnersList", () => {
  it("renders ranked earners", () => {
    render(
      <AnalyticsTopEarnersList
        currency="USD"
        earners={[
          {
            employeeId: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            country: "US",
            baseSalary: 132_000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("$132,000")).toBeTruthy();
  });

  it("shows an empty state when no earners are available", () => {
    render(<AnalyticsTopEarnersList currency="USD" earners={[]} />);

    expect(screen.getByText(/No earners found for USD/)).toBeTruthy();
  });
});
