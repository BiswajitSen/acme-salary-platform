import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { EmployeeRow } from "./employee-row";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./employee-avatar", () => ({
  EmployeeAvatar: () => <div data-testid="employee-avatar" />,
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

describe("EmployeeRow", () => {
  it("renders the table layout with converted salary", () => {
    render(
      <EmployeeRow
        employee={sampleEmployee}
        displayCurrency="EUR"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={24}
      />,
    );

    const row = screen.getByTestId("employee-row-E001");
    expect(row).toHaveAttribute("href", "/employees/E001");
    expect(row).toHaveStyle({ transform: "translateY(24px)" });
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("renders the mobile card layout", () => {
    render(
      <EmployeeRow
        employee={sampleEmployee}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={0}
        layout="mobile"
      />,
    );

    const row = screen.getByTestId("employee-row-E001");
    expect(row).not.toHaveAttribute("style");
    expect(screen.queryByText("View")).not.toBeInTheDocument();
    expect(screen.getByText("$132,000")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows an em dash when compensation is missing", () => {
    render(
      <EmployeeRow
        employee={{ ...sampleEmployee, baseSalary: null, currency: null }}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={0}
        layout="mobile"
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the native salary when exchange rates are unavailable", () => {
    render(
      <EmployeeRow
        employee={sampleEmployee}
        displayCurrency="EUR"
        ratesToUsd={null}
        offsetY={0}
      />,
    );

    expect(screen.getByText("$132,000")).toBeInTheDocument();
  });

  it("labels employees without salary in the table layout", () => {
    render(
      <EmployeeRow
        employee={{ ...sampleEmployee, employmentStatus: "NO_COMPENSATION" }}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={0}
      />,
    );

    expect(screen.getByText("No salary")).toBeInTheDocument();
  });

  it("shows inactive status styling on mobile cards", () => {
    render(
      <EmployeeRow
        employee={{ ...sampleEmployee, employmentStatus: "NO_COMPENSATION" }}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={0}
        layout="mobile"
      />,
    );

    expect(screen.getByText("No salary")).toBeInTheDocument();
  });

  it("uses muted salary styling in the table layout when compensation is missing", () => {
    render(
      <EmployeeRow
        employee={{ ...sampleEmployee, baseSalary: null, currency: null }}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
        offsetY={0}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
