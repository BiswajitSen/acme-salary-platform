import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsDepartmentPayrollSection } from "./analytics-department-payroll-section";
import { AnalyticsHorizontalBarChart } from "./analytics-horizontal-bar-chart";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { AnalyticsTopEarnersList } from "./analytics-top-earners-list";

const { useMobileLayout } = vi.hoisted(() => ({
  useMobileLayout: vi.fn(() => false),
}));

vi.mock("@/lib/hooks/use-mobile-layout", () => ({
  useMobileLayout,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Bar: () => null,
}));

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

    expect(screen.getByRole("table")).toHaveTextContent("Engineering");
    expect(screen.getByRole("list")).toHaveTextContent("Engineering");
    expect(screen.getAllByText("$120,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$115,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0);
  });
});

describe("AnalyticsHorizontalBarChart", () => {
  it("renders an empty state when there is no data", () => {
    render(
      <AnalyticsHorizontalBarChart
        data={[]}
        valueFormatter={(value) => `$${value}`}
        emptyMessage="No department data"
      />,
    );

    expect(screen.getByText("No department data")).toBeTruthy();
  });

  it("renders a chart for desktop layouts", () => {
    useMobileLayout.mockReturnValue(false);

    render(
      <AnalyticsHorizontalBarChart
        data={[{ label: "Engineering", value: 120_000 }]}
        valueFormatter={(value) => `$${value}`}
        emptyMessage="No department data"
      />,
    );

    expect(screen.getByTestId("bar-chart")).toBeTruthy();
  });

  it("renders a chart for mobile layouts", () => {
    useMobileLayout.mockReturnValue(true);

    render(
      <AnalyticsHorizontalBarChart
        data={[{ label: "Engineering", value: 120_000 }]}
        valueFormatter={(value) => `$${value}`}
        emptyMessage="No department data"
      />,
    );

    expect(screen.getByTestId("bar-chart")).toBeTruthy();
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
