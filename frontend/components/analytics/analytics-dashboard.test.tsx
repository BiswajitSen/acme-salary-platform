import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsDashboard } from "./analytics-dashboard";

const { useAnalyticsDashboardMock } = vi.hoisted(() => ({
  useAnalyticsDashboardMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-analytics-dashboard", () => ({
  useAnalyticsDashboard: (...args: unknown[]) => useAnalyticsDashboardMock(...args),
}));

describe("AnalyticsDashboard", () => {
  afterEach(() => {
    cleanup();
    useAnalyticsDashboardMock.mockReset();
  });

  it("renders KPI cards and analytics sections when data is loaded", async () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      summary: { currency: "USD", headcount: 3, totalPayroll: 396_000 },
      departmentStatistics: {
        currency: "USD",
        departments: [
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 120_000,
            medianSalary: 120_000,
          },
        ],
      },
      topEarners: {
        currency: "USD",
        earners: [
          {
            employeeId: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            baseSalary: 132_000,
          },
        ],
      },
      isLoading: false,
      errorMessage: null,
      selectCurrency: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Analytics Dashboard")).toBeTruthy();
    expect(screen.getByText("Headcount")).toBeTruthy();
    expect(screen.getByText("Total payroll")).toBeTruthy();
    expect(screen.getByText("Salary by department")).toBeTruthy();
    expect(screen.getByText("Top earners")).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });

  it("shows a loading state while analytics data is fetched", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      summary: null,
      departmentStatistics: null,
      topEarners: null,
      isLoading: true,
      errorMessage: null,
      selectCurrency: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Loading analytics…")).toBeTruthy();
  });

  it("shows an error alert when loading fails", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      summary: null,
      departmentStatistics: null,
      topEarners: null,
      isLoading: false,
      errorMessage: "Unable to load analytics dashboard data.",
      selectCurrency: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Unable to load analytics dashboard data.")).toBeTruthy();
  });

  it("changes currency when the selector value changes", async () => {
    const selectCurrency = vi.fn();
    useAnalyticsDashboardMock.mockReturnValue({
      currency: "USD",
      summary: { currency: "USD", headcount: 1, totalPayroll: 100_000 },
      departmentStatistics: { currency: "USD", departments: [] },
      topEarners: { currency: "USD", earners: [] },
      isLoading: false,
      errorMessage: null,
      selectCurrency,
    });

    render(<AnalyticsDashboard />);

    await userEvent.selectOptions(screen.getByLabelText("Currency"), "GBP");

    await waitFor(() => {
      expect(selectCurrency).toHaveBeenCalledWith("GBP");
    });
  });
});
