import { describe, expect, it, vi } from "vitest";

import {
  executeParsedInsightQuery,
  type InsightExecutorContext,
} from "./execute-insight-query.js";

function createContext(
  overrides: Partial<InsightExecutorContext> = {},
): InsightExecutorContext {
  return {
    getAnalyticsSummary: vi.fn().mockResolvedValue({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
    }),
    getScopedSalaryStatistics: vi.fn().mockResolvedValue({
      currency: "USD",
      employeeCount: 10,
      averageSalary: 120_000,
      medianSalary: 118_000,
    }),
    getTopEarners: vi.fn().mockResolvedValue({
      currency: "USD",
      earners: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 132_000,
        },
      ],
    }),
    getRecentPromotions: vi.fn().mockResolvedValue({
      asOfDate: "2026-01-01",
      promotions: [],
    }),
    ...overrides,
  };
}

describe("executeParsedInsightQuery", () => {
  it("returns UNSUPPORTED_INTENT for UNKNOWN parsed queries", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke",
        department: null,
        country: null,
        currency: null,
      },
      createContext(),
    );

    expect(response).toEqual({
      parsedQuery: {
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke",
        department: null,
        country: null,
        currency: null,
      },
      result: null,
      error: {
        kind: "UNSUPPORTED_INTENT",
        message: "This question is not supported yet.",
      },
    });
  });

  it("executes AVG_DEPT_SALARY using department salary statistics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        country: null,
        currency: null,
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: null,
      department: "Engineering",
      averageSalary: 120_000,
      employeeCount: 10,
    });
    expect(response.error).toBeNull();
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", null, "Engineering");
  });

  it("executes AVG_DEPT_SALARY for a country-scoped query", async () => {
    const context = createContext({
      getScopedSalaryStatistics: vi.fn().mockResolvedValue({
        currency: "USD",
        employeeCount: 2,
        averageSalary: 36_000,
        medianSalary: 35_000,
      }),
    });

    const response = await executeParsedInsightQuery(
      {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary in India?",
        department: null,
        country: "IN",
        currency: null,
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: "IN",
      department: null,
      averageSalary: 36_000,
      employeeCount: 2,
    });
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", "IN", null);
  });

  it("executes MEDIAN_DEPT_SALARY using department salary statistics", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary in Engineering",
        department: "Engineering",
        country: null,
        currency: "GBP",
      },
      createContext(),
    );

    expect(response.result).toEqual({
      intent: "MEDIAN_DEPT_SALARY",
      currency: "GBP",
      country: null,
      department: "Engineering",
      medianSalary: 118_000,
      employeeCount: 10,
    });
  });

  it("executes HEADCOUNT using analytics summary", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "HEADCOUNT",
        originalQuery: "headcount in USD",
        department: null,
        currency: "USD",
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "HEADCOUNT",
      currency: "USD",
      country: null,
      department: null,
      headcount: 42,
    });
    expect(context.getAnalyticsSummary).toHaveBeenCalledWith("USD", null, null);
  });

  it("executes TOTAL_PAYROLL using analytics summary", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll in USD",
        department: null,
        currency: "USD",
      },
      createContext(),
    );

    expect(response.result).toEqual({
      intent: "TOTAL_PAYROLL",
      currency: "USD",
      country: null,
      department: null,
      totalPayroll: 5_280_000,
    });
  });

  it("returns department and country scoped total payroll", async () => {
    const context = createContext({
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        currency: "USD",
        headcount: 1,
        totalPayroll: 36_000,
      }),
    });

    const response = await executeParsedInsightQuery(
      {
        intent: "TOTAL_PAYROLL",
        originalQuery: "Total payroll for Engineering in India",
        department: "Engineering",
        country: "IN",
        currency: null,
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "TOTAL_PAYROLL",
      currency: "USD",
      country: "IN",
      department: "Engineering",
      totalPayroll: 36_000,
    });
    expect(context.getAnalyticsSummary).toHaveBeenCalledWith("USD", "IN", "Engineering");
  });

  it("executes TOP_EARNERS using top earners analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "TOP_EARNERS",
        originalQuery: "top earners in USD",
        department: null,
        country: null,
        currency: "USD",
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "TOP_EARNERS",
      currency: "USD",
      country: null,
      earners: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 132_000,
        },
      ],
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD", null);
  });

  it("returns COUNTRY_NOT_FOUND when a country filter has no earners", async () => {
    const context = createContext({
      getTopEarners: vi.fn().mockResolvedValue({
        currency: "USD",
        earners: [],
      }),
    });

    const response = await executeParsedInsightQuery(
      {
        intent: "TOP_EARNERS",
        originalQuery: "top earners in India",
        department: null,
        country: "IN",
        currency: null,
      },
      context,
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "COUNTRY_NOT_FOUND",
      message: "No salary data found for employees in IN (amounts shown in USD).",
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD", "IN");
  });

  it("returns COUNTRY_NOT_FOUND when a scoped salary query has no data", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in HR",
        department: "HR",
        country: null,
        currency: "USD",
      },
      createContext({
        getScopedSalaryStatistics: vi.fn().mockResolvedValue({
          currency: "USD",
          employeeCount: 0,
          averageSalary: 0,
          medianSalary: 0,
        }),
      }),
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "COUNTRY_NOT_FOUND",
      message: "No salary data found for HR (amounts shown in USD).",
    });
  });

  it("rejects unsafe parsed queries before calling analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "HEADCOUNT",
        originalQuery: "headcount; DROP TABLE employees",
        department: null,
        country: null,
        currency: "USD",
        months: null,
      },
      context,
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "REJECTED_INPUT",
      message: "Invalid or unsafe query input.",
    });
    expect(context.getAnalyticsSummary).not.toHaveBeenCalled();
  });

  it("executes RECENT_PROMOTIONS using promotion history", async () => {
    const context = createContext({
      getRecentPromotions: vi.fn().mockResolvedValue({
        asOfDate: "2026-01-01",
        promotions: [
          {
            employeeId: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            baseSalary: 140_000,
            currency: "USD",
            effectiveDate: "2026-01-01",
          },
        ],
      }),
    });

    const response = await executeParsedInsightQuery(
      {
        intent: "RECENT_PROMOTIONS",
        originalQuery: "List employees who got promotion in the last 3months",
        department: null,
        country: null,
        currency: null,
        months: 3,
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "RECENT_PROMOTIONS",
      months: 3,
      country: null,
      department: null,
      promotions: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 140_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
        },
      ],
    });
    expect(context.getRecentPromotions).toHaveBeenCalledWith(3, null, null);
  });
});
