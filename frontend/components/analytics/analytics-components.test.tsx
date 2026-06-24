import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnalyticsDepartmentTable } from "./analytics-department-table";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { AnalyticsTopEarnersList } from "./analytics-top-earners-list";

describe("AnalyticsKpiCards", () => {
  it("renders headcount and total payroll metrics", () => {
    render(
      <AnalyticsKpiCards currency="USD" headcount={42} totalPayroll={5_000_000} />,
    );

    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("$5,000,000")).toBeTruthy();
  });
});

describe("AnalyticsDepartmentTable", () => {
  it("renders department salary statistics", () => {
    render(
      <AnalyticsDepartmentTable
        currency="USD"
        departments={[
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 120_000,
            medianSalary: 115_000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Engineering")).toBeTruthy();
    expect(screen.getByText("$120,000")).toBeTruthy();
    expect(screen.getByText("$115,000")).toBeTruthy();
  });

  it("shows an empty state when no departments are available", () => {
    render(<AnalyticsDepartmentTable currency="USD" departments={[]} />);

    expect(screen.getByText(/No department statistics available for USD/)).toBeTruthy();
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
