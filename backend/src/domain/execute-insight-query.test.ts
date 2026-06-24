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
    getDepartmentSalaryStatistics: vi.fn().mockResolvedValue({
      currency: "USD",
      departments: [
        {
          department: "Engineering",
          employeeCount: 10,
          averageSalary: 120_000,
          medianSalary: 118_000,
        },
      ],
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
        currency: null,
      },
      createContext(),
    );

    expect(response).toEqual({
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
    });
  });

  it("executes AVG_DEPT_SALARY using department salary statistics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        currency: null,
      },
      context,
    );

    expect(response.result).toEqual({
      intent: "AVG_DEPT_SALARY",
      currency: "USD",
      department: "Engineering",
      averageSalary: 120_000,
      employeeCount: 10,
    });
    expect(response.error).toBeNull();
    expect(context.getDepartmentSalaryStatistics).toHaveBeenCalledWith("USD");
  });

  it("executes MEDIAN_DEPT_SALARY using department salary statistics", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary in Engineering",
        department: "Engineering",
        currency: "GBP",
      },
      createContext(),
    );

    expect(response.result).toEqual({
      intent: "MEDIAN_DEPT_SALARY",
      currency: "GBP",
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
      headcount: 42,
    });
    expect(context.getAnalyticsSummary).toHaveBeenCalledWith("USD");
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
      totalPayroll: 5_280_000,
    });
  });

  it("executes TOP_EARNERS using top earners analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "TOP_EARNERS",
        originalQuery: "top earners in USD",
        department: null,
        currency: "USD",
      },
      context,
    );

    expect(response.result).toEqual({
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
    });
    expect(context.getTopEarners).toHaveBeenCalledWith("USD");
  });

  it("returns DEPARTMENT_NOT_FOUND when the department has no salary data", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in HR",
        department: "HR",
        currency: "USD",
      },
      createContext(),
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "DEPARTMENT_NOT_FOUND",
      message: "No salary data found for HR in USD.",
    });
  });

  it("returns DEPARTMENT_NOT_FOUND when a department salary intent has no department", async () => {
    const response = await executeParsedInsightQuery(
      {
        intent: "MEDIAN_DEPT_SALARY",
        originalQuery: "median salary",
        department: null,
        currency: "USD",
      },
      createContext(),
    );

    expect(response.result).toBeNull();
    expect(response.error).toEqual({
      kind: "DEPARTMENT_NOT_FOUND",
      message: "No salary data found for the requested department in USD.",
    });
  });

  it("rejects unsafe parsed queries before calling analytics", async () => {
    const context = createContext();

    const response = await executeParsedInsightQuery(
      {
        intent: "HEADCOUNT",
        originalQuery: "headcount; DROP TABLE employees",
        department: null,
        currency: "USD",
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
});
