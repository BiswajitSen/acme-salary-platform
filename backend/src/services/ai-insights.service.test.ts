import { describe, expect, it, vi } from "vitest";

import { AiInsightsService } from "./ai-insights.service.js";
import type { AnalyticsService } from "./analytics.service.js";

function createAnalyticsServiceMock(): AnalyticsService {
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
  } as unknown as AnalyticsService;
}

describe("AiInsightsService", () => {
  it("parses a natural language analytics question into an intent", () => {
    const service = new AiInsightsService(createAnalyticsServiceMock());

    expect(service.parseQuery({ query: "average salary in Engineering" })).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering",
      department: "Engineering",
      currency: null,
    });
  });

  it("rejects invalid request bodies", () => {
    const service = new AiInsightsService(createAnalyticsServiceMock());

    expect(() => service.parseQuery({ query: "" })).toThrow();
  });

  it("executes a parsed average salary question against analytics", async () => {
    const analyticsService = createAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({ query: "average salary in Engineering" }),
    ).resolves.toEqual({
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
    expect(analyticsService.getDepartmentSalaryStatistics).toHaveBeenCalledWith({
      currency: "USD",
    });
  });

  it("returns a graceful error for unsupported intents", async () => {
    const service = new AiInsightsService(createAnalyticsServiceMock());

    await expect(service.executeQuery({ query: "Tell me a joke" })).resolves.toEqual({
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

  it("executes top earners questions against analytics", async () => {
    const analyticsService = createAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(service.executeQuery({ query: "top earners in USD" })).resolves.toMatchObject({
      parsedQuery: {
        intent: "TOP_EARNERS",
      },
      result: {
        intent: "TOP_EARNERS",
        currency: "USD",
      },
      error: null,
    });
    expect(analyticsService.getTopEarners).toHaveBeenCalledWith({ currency: "USD" });
  });

  it("executes headcount questions against analytics", async () => {
    const analyticsService = createAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(service.executeQuery({ query: "headcount in USD" })).resolves.toMatchObject({
      parsedQuery: {
        intent: "HEADCOUNT",
      },
      result: {
        intent: "HEADCOUNT",
        headcount: 42,
      },
      error: null,
    });
    expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith({ currency: "USD" });
  });
});
