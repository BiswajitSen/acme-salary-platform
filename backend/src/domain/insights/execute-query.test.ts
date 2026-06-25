import { describe, expect, it, vi } from "vitest";

import type { ParsedInsightQuery } from "@acme/shared";

import {
  executeParsedInsightQuery,
  type InsightExecutorContext,
} from "./execute-query.js";

function parsed(
  overrides: Partial<ParsedInsightQuery> &
    Pick<ParsedInsightQuery, "intent" | "originalQuery">,
): ParsedInsightQuery {
  return {
    department: null,
    country: null,
    jobTitle: null,
    currency: null,
    months: null,
    sinceDate: null,
    limit: null,
    ...overrides,
  };
}

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
    getRecentTimelineEvents: vi.fn().mockResolvedValue({
      asOfDate: "2026-01-01",
      events: [],
    }),
    getBottomEarners: vi.fn().mockResolvedValue({
      currency: "USD",
      earners: [
        {
          employeeId: "E002",
          fullName: "Bob Smith",
          department: "HR",
          baseSalary: 85_000,
        },
      ],
    }),
    getNearMedianEarners: vi.fn().mockResolvedValue({
      currency: "USD",
      medianSalary: 119_000,
      tolerancePercent: 10,
      earners: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 120_000,
        },
      ],
    }),
    ...overrides,
  };
}

describe("executeParsedInsightQuery", () => {
  it("returns UNSUPPORTED_INTENT for UNKNOWN parsed queries", async () => {
    const response = await executeParsedInsightQuery(
      parsed({
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke",
      }),
      createContext(),
    );

    expect(response).toEqual({
      parsedQuery: parsed({
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke",
      }),
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
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: null,
      department: "Engineering",
      jobTitle: null,
      averageSalary: 120_000,
      employeeCount: 10,
    });
    expect(response.error).toBeNull();
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", {
      department: "Engineering",
    });
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
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary in India?",
        country: "IN",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: "IN",
      department: null,
      jobTitle: null,
      averageSalary: 36_000,
      employeeCount: 2,
    });
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", { country: "IN" });
  });

  it("executes MEDIAN_DEPT_SALARY using department salary statistics", async () => {
    const response = await executeParsedInsightQuery(
      parsed({
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary in Engineering",
        department: "Engineering",
        currency: "GBP",
      }),
      createContext(),
    );

    expect(response.result).toEqual({
      intent: "MEDIAN_DEPT_SALARY",
      currency: "GBP",
      country: null,
      department: "Engineering",
      jobTitle: null,
      medianSalary: 118_000,
      employeeCount: 10,
    });
  });

  it("executes HEADCOUNT using analytics summary", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "HEADCOUNT",
        originalQuery: "headcount in USD",
        currency: "USD",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "HEADCOUNT",
      currency: "USD",
      country: null,
      department: null,
      jobTitle: null,
      headcount: 42,
    });
    expect(context.getAnalyticsSummary).toHaveBeenCalledWith("USD", {});
  });

  it("executes TOTAL_PAYROLL using analytics summary", async () => {
    const response = await executeParsedInsightQuery(
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "total payroll in USD",
        currency: "USD",
      }),
      createContext(),
    );

    expect(response.result).toEqual({
      intent: "TOTAL_PAYROLL",
      currency: "USD",
      country: null,
      department: null,
      jobTitle: null,
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
      parsed({
        intent: "TOTAL_PAYROLL",
        originalQuery: "Total payroll for Engineering in India",
        department: "Engineering",
        country: "IN",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "TOTAL_PAYROLL",
      currency: "USD",
      country: "IN",
      department: "Engineering",
      jobTitle: null,
      totalPayroll: 36_000,
    });
    expect(context.getAnalyticsSummary).toHaveBeenCalledWith("USD", {
      country: "IN",
      department: "Engineering",
    });
  });

  it("executes TOP_EARNERS using top earners analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "top earners in USD",
        currency: "USD",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "TOP_EARNERS",
      currency: "USD",
      country: null,
      department: null,
      jobTitle: null,
      limit: 10,
      earners: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 132_000,
        },
      ],
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD", {}, 10);
  });

  it("executes TOP_EARNERS with a parsed limit", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "top 5 earners in Engineering",
        department: "Engineering",
        limit: 5,
      }),
      context,
    );

    expect(response.result).toMatchObject({
      intent: "TOP_EARNERS",
      limit: 5,
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD", { department: "Engineering" }, 5);
  });

  it("executes organization-wide average salary without requiring a scope filter", async () => {
    const context = createContext({
      getScopedSalaryStatistics: vi.fn().mockResolvedValue({
        currency: "USD",
        employeeCount: 2,
        averageSalary: 119_125,
        medianSalary: 119_125,
      }),
    });

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "What is the average salary?",
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      country: null,
      department: null,
      jobTitle: null,
      averageSalary: 119_125,
      employeeCount: 2,
    });
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", {});
  });

  it("returns COUNTRY_NOT_FOUND when a country filter has no earners", async () => {
    const context = createContext({
      getTopEarners: vi.fn().mockResolvedValue({
        currency: "USD",
        earners: [],
      }),
    });

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "TOP_EARNERS",
        originalQuery: "top earners in India",
        country: "IN",
      }),
      context,
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "COUNTRY_NOT_FOUND",
      message: "No salary data found for employees in IN (amounts shown in USD).",
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD", { country: "IN" }, 10);
  });

  it("returns COUNTRY_NOT_FOUND when a scoped salary query has no data", async () => {
    const response = await executeParsedInsightQuery(
      parsed({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in HR",
        department: "HR",
        currency: "USD",
      }),
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
      parsed({
        intent: "HEADCOUNT",
        originalQuery: "headcount; DROP TABLE employees",
        currency: "USD",
      }),
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
      getRecentTimelineEvents: vi.fn().mockResolvedValue({
        asOfDate: "2026-01-01",
        events: [
          {
            employeeId: "E001",
            fullName: "Jane Doe",
            department: "Engineering",
            baseSalary: 140_000,
            currency: "USD",
            effectiveDate: "2026-01-01",
            reason: "Promotion",
          },
        ],
      }),
    });

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "List employees who got promotion in the last 3months",
        months: 3,
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "RECENT_PROMOTIONS",
      months: 3,
      sinceDate: null,
      country: null,
      department: null,
      jobTitle: null,
      promotions: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 140_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason: "Promotion",
        },
      ],
    });
    expect(context.getRecentTimelineEvents).toHaveBeenCalledWith("RECENT_PROMOTIONS", {
      months: 3,
      sinceDate: null,
      country: null,
      department: null,
      jobTitle: null,
      reasons: ["Promotion"],
    });
  });

  it("executes RECENT_NEW_HIRES for joiner timeline questions", async () => {
    const context = createContext({
      getRecentTimelineEvents: vi.fn().mockResolvedValue({
        asOfDate: "2026-01-01",
        events: [
          {
            employeeId: "E003",
            fullName: "Alice Chen",
            department: "Engineering",
            baseSalary: 95_000,
            currency: "USD",
            effectiveDate: "2026-01-01",
            reason: "New Hire",
          },
        ],
      }),
    });

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "RECENT_NEW_HIRES",
        originalQuery: "employees who joined as engineers in the last 12 months",
        department: "Engineering",
        months: 12,
      }),
      context,
    );

    expect(response.result).toEqual({
      intent: "RECENT_NEW_HIRES",
      months: 12,
      sinceDate: null,
      country: null,
      department: "Engineering",
      jobTitle: null,
      hires: [
        {
          employeeId: "E003",
          fullName: "Alice Chen",
          department: "Engineering",
          baseSalary: 95_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason: "New Hire",
        },
      ],
    });
  });

  it("executes RECENT_SALARY_INCREASES for country-scoped hike questions", async () => {
    const context = createContext({
      getRecentTimelineEvents: vi.fn().mockResolvedValue({
        asOfDate: "2026-01-01",
        events: [
          {
            employeeId: "E010",
            fullName: "Raj Patel",
            department: "Engineering",
            baseSalary: 3_200_000,
            currency: "INR",
            effectiveDate: "2026-01-01",
            reason: "Annual Increment",
          },
        ],
      }),
    });

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "RECENT_SALARY_INCREASES",
        originalQuery: "employees in India who got salary hike in the last 3 months",
        country: "IN",
        months: 3,
      }),
      context,
    );

    expect(response.result?.intent).toBe("RECENT_SALARY_INCREASES");
    expect(context.getRecentTimelineEvents).toHaveBeenCalledWith(
      "RECENT_SALARY_INCREASES",
      expect.objectContaining({
        months: 3,
        country: "IN",
      }),
    );
  });

  it("executes BOTTOM_EARNERS using bottom earners analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "BOTTOM_EARNERS",
        originalQuery: "who are the least earners?",
      }),
      context,
    );

    expect(response.result).toMatchObject({
      intent: "BOTTOM_EARNERS",
      currency: "USD",
      limit: 10,
      earners: [{ employeeId: "E002" }],
    });
    expect(context.getBottomEarners).toHaveBeenCalledWith("USD", {}, 10);
  });

  it("executes NEAR_MEDIAN_EARNERS using scoped median band analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      parsed({
        intent: "NEAR_MEDIAN_EARNERS",
        originalQuery: "who earn around the median in Engineering?",
        department: "Engineering",
      }),
      context,
    );

    expect(response.result).toMatchObject({
      intent: "NEAR_MEDIAN_EARNERS",
      currency: "USD",
      department: "Engineering",
      medianSalary: 119_000,
      tolerancePercent: 10,
    });
    expect(context.getScopedSalaryStatistics).toHaveBeenCalledWith("USD", {
      department: "Engineering",
    });
    expect(context.getNearMedianEarners).toHaveBeenCalledWith(
      "USD",
      { department: "Engineering" },
      10,
    );
  });
});
