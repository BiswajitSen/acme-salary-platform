import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getInsightResultCurrency } from "@/lib/insight-result-currency";

import { useInsightQueryParser } from "./use-insight-query-parser";

const { executeInsightQueryMock } = vi.hoisted(() => ({
  executeInsightQueryMock: vi.fn(),
}));

vi.mock("@/lib/api/ai-insights", () => ({
  executeInsightQuery: (...args: unknown[]) => executeInsightQueryMock(...args),
}));

describe("useInsightQueryParser", () => {
  beforeEach(() => {
    executeInsightQueryMock.mockReset();
  });

  it("executes a submitted natural language query", async () => {
    executeInsightQueryMock.mockResolvedValue({
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
    });

    const { result } = renderHook(() => useInsightQueryParser("USD"));

    act(() => {
      result.current.updateQuery("average salary in Engineering");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.response?.result?.intent).toBe("AVG_DEPT_SALARY");
    });
    expect(executeInsightQueryMock).toHaveBeenCalledWith(
      "average salary in Engineering",
      "USD",
    );
  });

  it("requires a non-empty query before submitting", async () => {
    const { result } = renderHook(() => useInsightQueryParser("USD"));

    await act(async () => {
      await result.current.submitQuery();
    });

    expect(result.current.errorMessage).toContain("Enter a question");
    expect(executeInsightQueryMock).not.toHaveBeenCalled();
  });

  it("surfaces an error when execution fails", async () => {
    executeInsightQueryMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInsightQueryParser("USD"));

    act(() => {
      result.current.updateQuery("average salary in Engineering");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to run");
    });
  });

  it("clears state when resetQuery is called", async () => {
    executeInsightQueryMock.mockResolvedValue({
      parsedQuery: {
        intent: "TOP_EARNERS",
        originalQuery: "top earners in USD",
        department: null,
        country: null,
        currency: "USD",
      },
      result: {
        intent: "TOP_EARNERS",
        currency: "USD",
        country: null,
        earners: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useInsightQueryParser("USD"));

    act(() => {
      result.current.updateQuery("top earners in USD");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.response?.result?.intent).toBe("TOP_EARNERS");
    });

    act(() => {
      result.current.resetQuery();
    });

    expect(result.current.query).toBe("");
    expect(result.current.response).toBeNull();
  });

  it("does not rerun when display currency changes before any query was submitted", async () => {
    const { rerender } = renderHook(
      ({ displayCurrency }) => useInsightQueryParser(displayCurrency),
      { initialProps: { displayCurrency: "USD" } },
    );

    rerender({ displayCurrency: "GBP" });

    expect(executeInsightQueryMock).not.toHaveBeenCalled();
  });

  it("surfaces an error when currency rerun fails", async () => {
    executeInsightQueryMock.mockResolvedValueOnce({
      parsedQuery: {
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        currency: null,
      },
      result: {
        intent: "HEADCOUNT",
        currency: "USD",
        headcount: 42,
      },
      error: null,
    });
    executeInsightQueryMock.mockRejectedValueOnce(new Error("Network error"));

    const { result, rerender } = renderHook(
      ({ displayCurrency }) => useInsightQueryParser(displayCurrency),
      { initialProps: { displayCurrency: "USD" } },
    );

    act(() => {
      result.current.updateQuery("headcount");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    rerender({ displayCurrency: "GBP" });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to run");
    });
  });

  it("re-runs the previous query when display currency changes", async () => {
    executeInsightQueryMock.mockResolvedValueOnce({
      parsedQuery: {
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        currency: null,
      },
      result: {
        intent: "HEADCOUNT",
        currency: "USD",
        headcount: 42,
      },
      error: null,
      exchangeRatesAsOf: "2026-01-01",
    });
    executeInsightQueryMock.mockResolvedValueOnce({
      parsedQuery: {
        intent: "HEADCOUNT",
        originalQuery: "headcount",
        department: null,
        currency: null,
      },
      result: {
        intent: "HEADCOUNT",
        currency: "GBP",
        headcount: 42,
      },
      error: null,
      exchangeRatesAsOf: "2026-01-01",
    });

    const { result, rerender } = renderHook(
      ({ displayCurrency }) => useInsightQueryParser(displayCurrency),
      { initialProps: { displayCurrency: "USD" } },
    );

    act(() => {
      result.current.updateQuery("headcount");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(getInsightResultCurrency(result.current.response?.result)).toBe("USD");
    });

    rerender({ displayCurrency: "GBP" });

    await waitFor(() => {
      expect(getInsightResultCurrency(result.current.response?.result)).toBe("GBP");
    });
    expect(executeInsightQueryMock).toHaveBeenCalledTimes(2);
    expect(executeInsightQueryMock).toHaveBeenLastCalledWith("headcount", "GBP");
  });
});
