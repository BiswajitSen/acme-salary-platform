import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import { CompensationTimeline } from "./compensation-timeline";
import { EmployeeCurrentCompensation } from "./employee-current-compensation";
import { EmployeeProfileSummary } from "./employee-profile-summary";

describe("EmployeeProfileSummary", () => {
  it("renders employee summary fields", () => {
    render(
      <EmployeeProfileSummary
        profile={{
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
          currentCompensation: null,
        }}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });
});

describe("EmployeeCurrentCompensation", () => {
  it("renders current compensation metrics", () => {
    render(
      <EmployeeCurrentCompensation
        currentCompensation={{
          baseSalary: 132_000,
          currency: "USD",
          effectiveDate: "2025-01-01",
          reason: "Annual Increment",
          changedBy: "HR Admin",
          lastUpdated: "2025-01-02T10:00:00.000Z",
        }}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText("Annual Increment")).toBeInTheDocument();
    expect(screen.getByText("$132,000")).toBeInTheDocument();
  });

  it("converts current compensation into the selected display currency", () => {
    render(
      <EmployeeCurrentCompensation
        currentCompensation={{
          baseSalary: 86_300,
          currency: "SGD",
          effectiveDate: "2025-01-01",
          reason: "Annual Increment",
          changedBy: "HR Admin",
          lastUpdated: "2025-01-02T10:00:00.000Z",
        }}
        displayCurrency="INR"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText("₹5,393,750")).toBeInTheDocument();
  });

  it("falls back to the recorded currency when exchange rates are unavailable", () => {
    render(
      <EmployeeCurrentCompensation
        currentCompensation={{
          baseSalary: 86_300,
          currency: "SGD",
          effectiveDate: "2025-01-01",
          reason: "Annual Increment",
          changedBy: "HR Admin",
          lastUpdated: "2025-01-02T10:00:00.000Z",
        }}
        displayCurrency="INR"
        ratesToUsd={null}
      />,
    );

    expect(screen.getByText("SGD 86,300")).toBeInTheDocument();
  });

  it("shows an empty state when compensation is missing", () => {
    render(
      <EmployeeCurrentCompensation
        currentCompensation={null}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText(/No compensation history recorded yet/i)).toBeInTheDocument();
  });
});

describe("CompensationTimeline", () => {
  it("renders timeline rows newest first", () => {
    render(
      <CompensationTimeline
        entries={[
          {
            id: 2,
            previousSalary: 120_000,
            previousCurrency: "USD",
            baseSalary: 132_000,
            currency: "USD",
            effectiveDate: "2025-01-01",
            reason: "Annual Increment",
            changedBy: "HR Admin",
            notes: "Merit increase",
            createdAt: "2025-01-02T10:00:00.000Z",
          },
        ]}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText("Merit increase")).toBeInTheDocument();
    expect(screen.getByText("$120,000")).toBeInTheDocument();
  });

  it("converts timeline salaries into the selected display currency", () => {
    render(
      <CompensationTimeline
        entries={[
          {
            id: 1,
            previousSalary: 50_487,
            previousCurrency: "SGD",
            baseSalary: 86_300,
            currency: "SGD",
            effectiveDate: "2025-01-01",
            reason: "Annual Increment",
            changedBy: "HR Admin",
            notes: null,
            createdAt: "2025-01-02T10:00:00.000Z",
          },
        ]}
        displayCurrency="INR"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText("₹3,155,438")).toBeInTheDocument();
    expect(screen.getByText("₹5,393,750")).toBeInTheDocument();
  });

  it("falls back to the recorded currency when exchange rates are unavailable", () => {
    render(
      <CompensationTimeline
        entries={[
          {
            id: 1,
            previousSalary: 50_487,
            previousCurrency: "SGD",
            baseSalary: 86_300,
            currency: "SGD",
            effectiveDate: "2025-01-01",
            reason: "Annual Increment",
            changedBy: "HR Admin",
            notes: null,
            createdAt: "2025-01-02T10:00:00.000Z",
          },
        ]}
        displayCurrency="INR"
        ratesToUsd={null}
      />,
    );

    expect(screen.getByText("SGD 50,487")).toBeInTheDocument();
    expect(screen.getByText("SGD 86,300")).toBeInTheDocument();
  });

  it("shows an empty state when there are no entries", () => {
    render(
      <CompensationTimeline
        entries={[]}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getByText(/No compensation changes recorded yet/i)).toBeInTheDocument();
  });

  it("shows a dash when a timeline entry has no previous salary", () => {
    render(
      <CompensationTimeline
        entries={[
          {
            id: 1,
            previousSalary: null,
            previousCurrency: null,
            baseSalary: 90_000,
            currency: "USD",
            effectiveDate: "2024-01-01",
            reason: "New Hire",
            changedBy: "HR Admin",
            notes: null,
            createdAt: "2024-01-02T10:00:00.000Z",
          },
        ]}
        displayCurrency="USD"
        ratesToUsd={TEST_EXCHANGE_RATES_TO_USD}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
