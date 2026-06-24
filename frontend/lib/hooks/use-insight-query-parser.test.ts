import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInsightQueryParser } from "./use-insight-query-parser";

const { parseInsightQueryMock } = vi.hoisted(() => ({
  parseInsightQueryMock: vi.fn(),
}));

vi.mock("@/lib/api/ai-insights", () => ({
  parseInsightQuery: (...args: unknown[]) => parseInsightQueryMock(...args),
}));

describe("useInsightQueryParser", () => {
  beforeEach(() => {
    parseInsightQueryMock.mockReset();
  });

  it("parses a submitted natural language query", async () => {
    parseInsightQueryMock.mockResolvedValue({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering",
      department: "Engineering",
      currency: null,
    });

    const { result } = renderHook(() => useInsightQueryParser());

    act(() => {
      result.current.updateQuery("average salary in Engineering");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.parsedQuery?.intent).toBe("AVG_DEPT_SALARY");
    });
  });

  it("requires a non-empty query before submitting", async () => {
    const { result } = renderHook(() => useInsightQueryParser());

    await act(async () => {
      await result.current.submitQuery();
    });

    expect(result.current.errorMessage).toContain("Enter a question");
    expect(parseInsightQueryMock).not.toHaveBeenCalled();
  });

  it("surfaces an error when parsing fails", async () => {
    parseInsightQueryMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInsightQueryParser());

    act(() => {
      result.current.updateQuery("average salary in Engineering");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to parse");
    });
  });

  it("clears state when resetQuery is called", async () => {
    parseInsightQueryMock.mockResolvedValue({
      intent: "TOP_EARNERS",
      originalQuery: "top earners in USD",
      department: null,
      currency: "USD",
    });

    const { result } = renderHook(() => useInsightQueryParser());

    act(() => {
      result.current.updateQuery("top earners in USD");
    });
    await act(async () => {
      await result.current.submitQuery();
    });

    await waitFor(() => {
      expect(result.current.parsedQuery?.intent).toBe("TOP_EARNERS");
    });

    act(() => {
      result.current.resetQuery();
    });

    expect(result.current.query).toBe("");
    expect(result.current.parsedQuery).toBeNull();
  });
});
