import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("InsightQueryPanel", () => {
  afterEach(() => {
    cleanup();
    useInsightQueryParserMock.mockReset();
  });

  it("submits the query when the form is submitted", async () => {
    const submitQuery = vi.fn().mockResolvedValue(undefined);
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      parsedQuery: null,
      isParsing: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery,
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    fireEvent.submit(screen.getByRole("button", { name: "Parse query" }).closest("form")!);

    await waitFor(() => {
      expect(submitQuery).toHaveBeenCalled();
    });
  });

  it("shows parsed intent output when available", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      parsedQuery: {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        currency: null,
      },
      isParsing: false,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Detected intent")).toBeTruthy();
    expect(screen.getByText("AVG DEPT SALARY")).toBeTruthy();
  });

  it("fills the query from an example prompt", async () => {
    const updateQuery = vi.fn();
    useInsightQueryParserMock.mockReturnValue({
      query: "",
      parsedQuery: null,
      isParsing: false,
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
      parsedQuery: null,
      isParsing: false,
      errorMessage: null,
      updateQuery,
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    await userEvent.type(screen.getByLabelText("Natural language query"), "headcount");

    expect(updateQuery).toHaveBeenCalled();
  });

  it("shows an error alert when parsing fails", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "invalid",
      parsedQuery: null,
      isParsing: false,
      errorMessage: "Enter a question about salary analytics.",
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Enter a question about salary analytics.")).toBeTruthy();
  });

  it("shows a loading message while parsing", () => {
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      parsedQuery: null,
      isParsing: true,
      errorMessage: null,
      updateQuery: vi.fn(),
      submitQuery: vi.fn(),
      resetQuery: vi.fn(),
    });

    render(<InsightQueryPanel />);

    expect(screen.getByText("Parsing query…")).toBeTruthy();
  });

  it("clears the query when Clear is clicked", async () => {
    const resetQuery = vi.fn();
    useInsightQueryParserMock.mockReturnValue({
      query: "average salary in Engineering",
      parsedQuery: null,
      isParsing: false,
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
