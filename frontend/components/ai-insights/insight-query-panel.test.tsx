import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InsightExecutionResult } from "./insight-execution-result";
import { ParsedInsightSummary } from "./parsed-insight-summary";

const { useInsightQueryParserMock } = vi.hoisted(() => ({
  useInsightQueryParserMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-insight-query-parser", () => ({
  useInsightQueryParser: (...args: unknown[]) => useInsightQueryParserMock(...args),
}));

import { InsightQueryPanel } from "./insight-query-panel";

describe("ParsedInsightSummary", () => {
  it("renders parsed intent details", () => {
    render(
      <ParsedInsightSummary
        parsedQuery={{
          intent: "AVG_DEPT_SALARY",
          originalQuery: "average salary in Engineering",
          department: "Engineering",
          currency: null,
        }}
      />,
    );

    expect(screen.getByText("AVG DEPT SALARY")).toBeTruthy();
    expect(screen.getByText("Engineering")).toBeTruthy();
  });

  it("renders placeholders when department and currency are absent", () => {
    render(
      <ParsedInsightSummary
        parsedQuery={{
          intent: "HEADCOUNT",
          originalQuery: "headcount",
          department: null,
          currency: null,
        }}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});

describe("InsightExecutionResult", () => {
  it("renders average salary results", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "AVG_DEPT_SALARY",
          currency: "USD",
          department: "Engineering",
          averageSalary: 120_000,
          employeeCount: 10,
        }}
      />,
    );

    expect(screen.getByText("Average salary")).toBeTruthy();
    expect(screen.getByText("$120,000")).toBeTruthy();
  });

  it("renders median salary results", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "MEDIAN_DEPT_SALARY",
          currency: "USD",
          department: "Engineering",
          medianSalary: 118_000,
          employeeCount: 10,
        }}
      />,
    );

    expect(screen.getByText("Median salary")).toBeTruthy();
    expect(screen.getByText("$118,000")).toBeTruthy();
  });

  it("renders headcount results", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "HEADCOUNT",
          currency: "USD",
          headcount: 42,
        }}
      />,
    );

    expect(screen.getByText("42")).toBeTruthy();
  });

  it("renders total payroll results", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "TOTAL_PAYROLL",
          currency: "USD",
          totalPayroll: 5_280_000,
        }}
      />,
    );

    expect(screen.getByText("$5,280,000")).toBeTruthy();
  });

  it("renders top earners results", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "TOP_EARNERS",
          currency: "USD",
          earners: [
            {
              employeeId: "E001",
              fullName: "Jane Doe",
              department: "Engineering",
              baseSalary: 132_000,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("$132,000")).toBeTruthy();
  });

  it("renders an empty top earners message", () => {
    render(
      <InsightExecutionResult
        result={{
          intent: "TOP_EARNERS",
          currency: "USD",
          earners: [],
        }}
      />,
    );

    expect(screen.getByText("No earners found for USD.")).toBeTruthy();
  });
});

describe("InsightQueryPanel", () => {
  afterEach(() => {
    cleanup();
    useInsightQueryParserMock.mockReset();
  });

  it("submits the query when the form is submitted", async () => {
    const submitQuery = vi.fn().mockResolvedValue(undefined);
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      response: null,
      isSubmitting: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery,
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    fireEvent.submit(screen.getByRole("button", { name: "Run query" }).closest("form")!);

    await waitFor(() => {
      expect(submitQuery).toHaveBeenCalled();
    });
  });

  it("shows parsed intent output when available", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      response: {
        parsedQuery: {
          intent: "AVG_DEPT_SALARY",
          originalQuery: "average salary in Engineering",
          department: "Engineering",
          currency: null,
        },
        result: {
          intent: "AVG_DEPT_SALARY",
          currency: "USD",
          department: "Engineering",
          averageSalary: 120_000,
          employeeCount: 10,
        },
        error: null,
      },
      isSubmitting: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Detected intent")).toBeTruthy();
    expect(screen.getByText("Average salary")).toBeTruthy();
  });

  it("shows a graceful execution error when the intent is unsupported", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "Tell me a joke",
      response: {
        parsedQuery: {
          intent: "UNKNOWN",
          originalQuery: "Tell me a joke",
          department: null,
          currency: null,
        },
        result: null,
        error: {
          kind: "UNSUPPORTED_INTENT",
          message: "This question is not supported yet.",
        },
      },
      isSubmitting: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("This question is not supported yet.")).toBeTruthy();
  });

  it("fills the query from an example prompt", async () => {
    const updateQuery = vi.fn();
    useInsightQueryParserMock.mockReturnValue({
      query: "",
      response: null,
      isSubmitting: false,
      errorMessage: null,
      updateQuery,
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    await userEvent.click(screen.getByRole("button", { name: /average salary in Engineering/i }));

    expect(updateQuery).toHaveBeenCalledWith("What is the average salary in Engineering?");
  });

  it("updates the query when the textarea changes", async () => {
    const updateQuery = vi.fn();
    useInsightQueryParserMock.mockReturnValue({
      query: "",
      response: null,
      isSubmitting: false,
      errorMessage: null,
      updateQuery,
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    await userEvent.type(screen.getByLabelText("Natural language query"), "headcount");

    expect(updateQuery).toHaveBeenCalled();
  });

  it("shows an error alert when execution fails", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "invalid",
      response: null,
      isSubmitting: false,
      errorMessage: "Enter a question about salary analytics.",
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Enter a question about salary analytics.")).toBeTruthy();
  });

  it("shows a loading message while the query is running", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      response: null,
      isSubmitting: true,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Running query…")).toBeTruthy();
  });

  it("clears the query when Clear is clicked", async () => {
    const resetQuery = vi.fn();
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      response: null,
      isSubmitting: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery,
    });

    render(<InsightQueryPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(resetQuery).toHaveBeenCalled();
  });
});
