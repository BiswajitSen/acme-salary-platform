import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../middleware/error-handler.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { createAnalyticsRouter } from "./analytics.route.js";

function createTestApp(analyticsService: AnalyticsService) {
  const app = express();
  app.use(express.json());
  app.use("/analytics", createAnalyticsRouter({ analyticsService }), errorHandler);
  return app;
}

describe("createAnalyticsRouter", () => {
  it("returns analytics summary for a valid currency query", async () => {
    const analyticsService = {
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        currency: "USD",
        headcount: 3,
        totalPayroll: 396_000,
      }),
    } as unknown as AnalyticsService;

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/summary?currency=USD",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ currency: "USD", headcount: 3, totalPayroll: 396_000 });
    expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith({
      currency: "USD",
    });
  });

  it("returns 400 when currency query validation fails", async () => {
    const analyticsService = new AnalyticsService({
      countEmployeesWithLatestCompensationInCurrency: vi.fn(),
      sumLatestCompensationSalariesInCurrency: vi.fn(),
      findDepartmentSalaryStatisticsByCurrency: vi.fn(),
    });

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/summary?currency=US",
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation Error");
  });

  it("returns department salary statistics for a valid currency query", async () => {
    const analyticsService = {
      getDepartmentSalaryStatistics: vi.fn().mockResolvedValue({
        currency: "USD",
        departments: [
          {
            department: "Engineering",
            employeeCount: 2,
            averageSalary: 120_000,
            medianSalary: 120_000,
          },
        ],
      }),
    } as unknown as AnalyticsService;

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/departments?currency=USD",
    );

    expect(response.status).toBe(200);
    expect(response.body.departments).toHaveLength(1);
  });
});
