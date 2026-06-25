import { describe, expect, it } from "vitest";

import { resolveInsightExecutionCurrency } from "./execution-currency.js";

describe("resolveInsightExecutionCurrency", () => {
  it("prefers an explicit currency from the parsed query", () => {
    expect(
      resolveInsightExecutionCurrency(
        {
          intent: "TOP_EARNERS",
          originalQuery: "Who are the top earners in INR?",
          department: null,
          currency: "INR",
        },
        "USD",
      ),
    ).toBe("INR");
  });

  it("falls back to the display currency when the query has no currency", () => {
    expect(
      resolveInsightExecutionCurrency(
        {
          intent: "HEADCOUNT",
          originalQuery: "headcount",
          department: null,
          currency: null,
        },
        "GBP",
      ),
    ).toBe("GBP");
  });

  it("defaults to USD when neither source provides a currency", () => {
    expect(
      resolveInsightExecutionCurrency({
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll",
        department: null,
        currency: null,
      }),
    ).toBe("USD");
  });
});
