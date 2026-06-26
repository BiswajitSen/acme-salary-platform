import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { EmployeeDirectoryTable } from "./employee-directory-table";
import { emptyDirectoryFilters } from "./types";

const { useMobileLayout } = vi.hoisted(() => ({
  useMobileLayout: vi.fn(() => false),
}));

vi.mock("@/lib/hooks/use-mobile-layout", () => ({
  useMobileLayout,
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (options: {
    getScrollElement: () => unknown;
    estimateSize: () => number;
    count: number;
  }) => {
    options.getScrollElement();
    options.estimateSize();

    return {
      getTotalSize: () => 48,
      getVirtualItems: () => [{ index: 0, start: 0 }],
    };
  },
}));

vi.mock("./employee-row", () => ({
  EmployeeRow: ({
    employee,
    layout,
  }: {
    employee: { id: string; fullName: string };
    layout?: string;
  }) => (
    <div data-testid={`employee-row-${employee.id}`} data-layout={layout ?? "table"}>
      {employee.fullName}
    </div>
  ),
}));

const sampleEmployee = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
  baseSalary: 132_000,
  currency: "USD",
  employmentStatus: "ACTIVE" as const,
};

const emptyFilters = emptyDirectoryFilters;

const filterOptions = {
  countries: ["US"],
  departments: ["Engineering"],
  jobTitles: ["Senior Engineer"],
};

describe("EmployeeDirectoryTable", () => {
  it("renders the virtualized table on desktop", () => {
    useMobileLayout.mockReturnValue(false);

    render(
      <EmployeeDirectoryTable
        employees={[sampleEmployee]}
        filters={emptyFilters}
        filterOptions={filterOptions}
        onFilterChange={vi.fn()}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByRole("button", { name: "Filter by country" })).toBeInTheDocument();
    expect(screen.getByTestId("employee-row-E001")).toHaveAttribute("data-layout", "table");
  });

  it("renders a card list with column filters on mobile", () => {
    useMobileLayout.mockReturnValue(true);

    render(
      <EmployeeDirectoryTable
        employees={[sampleEmployee]}
        filters={emptyFilters}
        filterOptions={filterOptions}
        onFilterChange={vi.fn()}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByRole("button", { name: "Filter by country" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by department" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by job title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by employment status" })).toBeInTheDocument();
    expect(screen.getByTestId("employee-row-E001")).toHaveAttribute("data-layout", "mobile");
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows a loading message on mobile when employees are not ready", () => {
    useMobileLayout.mockReturnValue(true);

    render(
      <EmployeeDirectoryTable
        employees={[]}
        filters={emptyFilters}
        filterOptions={filterOptions}
        onFilterChange={vi.fn()}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        isLoading
      />,
    );

    expect(screen.getByText("Loading employees…")).toBeInTheDocument();
  });

  it("shows an empty message on mobile when no employees match", () => {
    useMobileLayout.mockReturnValue(true);

    render(
      <EmployeeDirectoryTable
        employees={[]}
        filters={{ ...emptyFilters, search: "missing" }}
        filterOptions={filterOptions}
        onFilterChange={vi.fn()}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText("No employees match the current filters.")).toBeInTheDocument();
  });
});
