import { describe, expect, it, vi } from "vitest";

import { AiInsightsService } from "./ai-insights.service.js";
import type { InsightAnalyticsService } from "./insight-analytics.service.js";

function createInsightAnalyticsServiceMock(): InsightAnalyticsService {
  return {
    getAnalyticsSummary: vi.fn().mockResolvedValue({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
      exchangeRatesAsOf: "2026-01-01",
    }),
    getScopedSalaryStatistics: vi.fn().mockResolvedValue({
      currency: "USD",
      employeeCount: 10,
      averageSalary: 120_000,
      medianSalary: 118_000,
      exchangeRatesAsOf: "2026-01-01",
    }),
    getDepartmentSalaryStatistics: vi.fn(),
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
      exchangeRatesAsOf: "2026-01-01",
    }),
    getExchangeRatesAsOf: vi.fn().mockResolvedValue("2026-01-01"),
    getRecentPromotions: vi.fn().mockResolvedValue({
      asOfDate: "2026-01-01",
      promotions: [],
    }),
  } as unknown as InsightAnalyticsService;
}

describe("AiInsightsService", () => {
  it("parses a natural language analytics question into an intent", () => {
    const service = new AiInsightsService(createInsightAnalyticsServiceMock());

    expect(service.parseQuery({ query: "average salary in Engineering" })).toEqual({
      intent: "AVG_DEPT_SALARY",
      originalQuery: "average salary in Engineering",
      department: "Engineering",
      country: null,
      currency: null,
      months: null,
    });
  });

  it("rejects invalid request bodies", () => {
    const service = new AiInsightsService(createInsightAnalyticsServiceMock());

    expect(() => service.parseQuery({ query: "" })).toThrow();
  });

  it("executes a parsed average salary question against analytics", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({ query: "average salary in Engineering" }),
    ).resolves.toEqual({
      parsedQuery: {
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        country: null,
        currency: null,
        months: null,
      },
      result: {
        intent: "AVG_DEPT_SALARY",
        currency: "USD",
        country: null,
        department: "Engineering",
        averageSalary: 120_000,
        employeeCount: 10,
      },
      error: null,
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsService.getScopedSalaryStatistics).toHaveBeenCalledWith({
      currency: "USD",
      department: "Engineering",
    });
  });

  it("returns a graceful error for unsupported intents", async () => {
    const service = new AiInsightsService(createInsightAnalyticsServiceMock());

    await expect(service.executeQuery({ query: "Tell me a joke" })).resolves.toEqual({
      parsedQuery: {
        intent: "UNKNOWN",
        originalQuery: "Tell me a joke",
        department: null,
        country: null,
        currency: null,
        months: null,
      },
      result: null,
      error: {
        kind: "UNSUPPORTED_INTENT",
        message: "This question is not supported yet.",
      },
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("executes top earners questions against analytics", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
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
    const analyticsService = createInsightAnalyticsServiceMock();
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

  it("uses the display currency when the query does not specify a currency", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({
        query: "headcount",
        displayCurrency: "GBP",
      }),
    ).resolves.toMatchObject({
      parsedQuery: {
        intent: "HEADCOUNT",
        currency: null,
      },
      result: {
        intent: "HEADCOUNT",
        currency: "GBP",
        headcount: 42,
      },
      error: null,
    });
    expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith({ currency: "GBP" });
  });

  it("uses an explicit query currency instead of the display currency selector", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({
        query: "Who are the top earners in INR?",
        displayCurrency: "USD",
      }),
    ).resolves.toMatchObject({
      parsedQuery: {
        intent: "TOP_EARNERS",
        currency: "INR",
      },
      result: {
        intent: "TOP_EARNERS",
        currency: "INR",
      },
      error: null,
    });
    expect(analyticsService.getTopEarners).toHaveBeenCalledWith({ currency: "INR" });
  });

  it("filters top earners by employee country when the query mentions a country", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({
        query: "Who are the top earners in INDIA?",
        displayCurrency: "USD",
      }),
    ).resolves.toMatchObject({
      parsedQuery: {
        intent: "TOP_EARNERS",
        country: "IN",
        currency: null,
      },
      result: {
        intent: "TOP_EARNERS",
        currency: "USD",
        country: "IN",
      },
      error: null,
    });
    expect(analyticsService.getTopEarners).toHaveBeenCalledWith({
      currency: "USD",
      country: "IN",
    });
  });

  it("rejects injection-style queries before calling analytics", async () => {
    const analyticsService = createInsightAnalyticsServiceMock();
    const service = new AiInsightsService(analyticsService);

    await expect(
      service.executeQuery({ query: "average salary; DROP TABLE employees" }),
    ).resolves.toMatchObject({
      parsedQuery: {
        intent: "UNKNOWN",
      },
      result: null,
      error: {
        kind: "REJECTED_INPUT",
        message: "Invalid or unsafe query input.",
      },
    });
    expect(analyticsService.getScopedSalaryStatistics).not.toHaveBeenCalled();
  });
});
