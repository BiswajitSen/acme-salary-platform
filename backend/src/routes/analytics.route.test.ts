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
  it("returns available currencies", async () => {
    const analyticsService = {
      getAvailableCurrencies: vi.fn().mockResolvedValue({
        currencies: ["GBP", "INR", "USD"],
        exchangeRatesAsOf: "2026-01-01",
        ratesToUsd: {
          USD: 1,
          GBP: 1.25,
          EUR: 1.1,
          INR: 0.012,
          SGD: 0.75,
        },
      }),
    } as unknown as AnalyticsService;

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/currencies",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currencies: ["GBP", "INR", "USD"],
      exchangeRatesAsOf: "2026-01-01",
      ratesToUsd: {
        USD: 1,
        GBP: 1.25,
        EUR: 1.1,
        INR: 0.012,
        SGD: 0.75,
      },
    });
  });

  it("returns analytics summary for a valid currency query", async () => {
    const analyticsService = {
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        currency: "USD",
        headcount: 3,
        totalPayroll: 396_000,
        exchangeRatesAsOf: "2026-01-01",
      }),
    } as unknown as AnalyticsService;

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/summary?currency=USD",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currency: "USD",
      headcount: 3,
      totalPayroll: 396_000,
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith({
      currency: "USD",
    });
  });

  it("returns 400 when currency query validation fails", async () => {
    const analyticsService = new AnalyticsService(
      {
        countEmployeesWithLatestCompensation: vi.fn(),
        sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
        findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
        findTopEarnersInDisplayCurrency: vi.fn(),
      },
      { fetchSnapshot: vi.fn() },
    );

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

  it("returns top earners for a valid currency query", async () => {
    const analyticsService = {
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

    const response = await request(createTestApp(analyticsService)).get(
      "/analytics/top-earners?currency=USD",
    );

    expect(response.status).toBe(200);
    expect(response.body.earners).toHaveLength(1);
  });

  it("forwards service errors to the error handler", async () => {
    const analyticsService = {
      getAvailableCurrencies: vi.fn().mockRejectedValue(new Error("Database unavailable")),
      getAnalyticsSummary: vi.fn().mockRejectedValue(new Error("Database unavailable")),
      getDepartmentSalaryStatistics: vi
        .fn()
        .mockRejectedValue(new Error("Database unavailable")),
      getTopEarners: vi.fn().mockRejectedValue(new Error("Database unavailable")),
    } as unknown as AnalyticsService;

    const app = createTestApp(analyticsService);

    await expect(request(app).get("/analytics/currencies")).resolves.toMatchObject({
      status: 500,
    });
    await expect(request(app).get("/analytics/summary?currency=USD")).resolves.toMatchObject({
      status: 500,
    });
    await expect(request(app).get("/analytics/departments?currency=USD")).resolves.toMatchObject({
      status: 500,
    });
    await expect(request(app).get("/analytics/top-earners?currency=USD")).resolves.toMatchObject({
      status: 500,
    });
  });
});
