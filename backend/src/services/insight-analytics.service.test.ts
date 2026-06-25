import { describe, expect, it, vi } from "vitest";

import { createTestExchangeRateSnapshot } from "@acme/shared";

import { InsightAnalyticsService } from "./insight-analytics.service.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

function createExchangeRateProviderMock(): IExchangeRateProvider {
  return {
    fetchSnapshot: vi.fn().mockResolvedValue(createTestExchangeRateSnapshot()),
  };
}

describe("InsightAnalyticsService", () => {
  it("returns headcount from the read-only analytics repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn().mockResolvedValue(42),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn().mockResolvedValue(5_280_000),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getAnalyticsSummary({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("rejects invalid currency query params before hitting the repository", async () => {
    const service = new InsightAnalyticsService(
      {
        countEmployeesWithLatestCompensation: vi.fn(),
        sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
        findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
        findTopEarnersInDisplayCurrency: vi.fn(),
      },
      createExchangeRateProviderMock(),
    );

    await expect(service.getAnalyticsSummary({ currency: "US" })).rejects.toThrow();
  });

  it("returns department salary statistics from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn().mockResolvedValue([
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 118_000,
        },
      ]),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getDepartmentSalaryStatistics({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      departments: [
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 118_000,
        },
      ],
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("returns top earners from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn().mockResolvedValue([
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 132_000,
        },
      ]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getTopEarners({ currency: "USD" })).resolves.toEqual({
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
    });
  });
});
