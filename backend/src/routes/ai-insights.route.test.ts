import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../middleware/error-handler.js";
import { AiInsightsService } from "../services/ai-insights.service.js";
import type { InsightAnalyticsService } from "../services/insight-analytics.service.js";
import { createAiInsightsRouter } from "./ai-insights.route.js";

function createInsightAnalyticsServiceMock(): InsightAnalyticsService {
  return {
    getAnalyticsSummary: vi.fn(),
    getDepartmentSalaryStatistics: vi.fn(),
    getTopEarners: vi.fn(),
  } as unknown as InsightAnalyticsService;
}

function createTestApp(aiInsightsService: AiInsightsService) {
  const app = express();
  app.use(express.json());
  app.use("/insights", createAiInsightsRouter({ aiInsightsService }), errorHandler);
  return app;
}

describe("createAiInsightsRouter", () => {
  it("parses a natural language query into an intent", async () => {
    const aiInsightsService = {
      parseQuery: vi.fn().mockReturnValue({
        intent: "AVG_DEPT_SALARY",
        originalQuery: "average salary in Engineering",
        department: "Engineering",
        currency: null,
      }),
      executeQuery: vi.fn(),
    } as unknown as AiInsightsService;

    const response = await request(createTestApp(aiInsightsService))
      .post("/insights/parse")
      .send({ query: "average salary in Engineering" });

    expect(response.status).toBe(200);
    expect(response.body.intent).toBe("AVG_DEPT_SALARY");
    expect(aiInsightsService.parseQuery).toHaveBeenCalledWith({
      query: "average salary in Engineering",
    });
  });

  it("returns 400 when query validation fails", async () => {
    const response = await request(createTestApp(new AiInsightsService(createInsightAnalyticsServiceMock())))
      .post("/insights/parse")
      .send({ query: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });

  it("forwards parse service errors to the error handler", async () => {
    const aiInsightsService = {
      parseQuery: vi.fn().mockImplementation(() => {
        throw new Error("Parser unavailable");
      }),
      executeQuery: vi.fn(),
    } as unknown as AiInsightsService;

    const response = await request(createTestApp(aiInsightsService))
      .post("/insights/parse")
      .send({ query: "average salary in Engineering" });

    expect(response.status).toBe(500);
  });

  it("executes a parsed query through whitelisted analytics executors", async () => {
    const aiInsightsService = {
      parseQuery: vi.fn(),
      executeQuery: vi.fn().mockResolvedValue({
        parsedQuery: {
          intent: "HEADCOUNT",
          originalQuery: "headcount in USD",
          department: null,
          currency: "USD",
        },
        result: {
          intent: "HEADCOUNT",
          currency: "USD",
          headcount: 42,
        },
        error: null,
      }),
    } as unknown as AiInsightsService;

    const response = await request(createTestApp(aiInsightsService))
      .post("/insights/execute")
      .send({ query: "headcount in USD" });

    expect(response.status).toBe(200);
    expect(response.body.result.headcount).toBe(42);
    expect(aiInsightsService.executeQuery).toHaveBeenCalledWith({
      query: "headcount in USD",
    });
  });

  it("returns 400 when execute query validation fails", async () => {
    const response = await request(createTestApp(new AiInsightsService(createInsightAnalyticsServiceMock())))
      .post("/insights/execute")
      .send({ query: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });

  it("forwards execute service errors to the error handler", async () => {
    const aiInsightsService = {
      parseQuery: vi.fn(),
      executeQuery: vi.fn().mockRejectedValue(new Error("Executor unavailable")),
    } as unknown as AiInsightsService;

    const response = await request(createTestApp(aiInsightsService))
      .post("/insights/execute")
      .send({ query: "headcount in USD" });

    expect(response.status).toBe(500);
  });
});
