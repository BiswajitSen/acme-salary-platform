import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_DISPLAY_CURRENCIES, createTestExchangeRateSnapshot } from "@acme/shared";

import { AnalyticsService } from "./analytics.service.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

function createExchangeRateProviderMock(): IExchangeRateProvider {
  return {
    fetchSnapshot: vi.fn().mockResolvedValue(createTestExchangeRateSnapshot()),
  };
}

describe("AnalyticsService", () => {
  it("returns supported display currencies for HR to switch between", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getAvailableCurrencies()).resolves.toEqual({
      currencies: [...ANALYTICS_DISPLAY_CURRENCIES],
      exchangeRatesAsOf: "2026-01-01",
      ratesToUsd: createTestExchangeRateSnapshot().ratesToUsd,
    });
  });

  it("returns org-wide headcount with payroll converted to the display currency", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn().mockResolvedValue(42),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn().mockResolvedValue(5_280_000),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getAnalyticsSummary({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsRepository.countEmployeesWithLatestCompensation).toHaveBeenCalled();
    expect(analyticsRepository.sumLatestCompensationSalariesInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      createTestExchangeRateSnapshot().ratesToUsd,
    );
  });

  it("rejects unsupported display currency codes", async () => {
    const service = new AnalyticsService(
      {
        countEmployeesWithLatestCompensation: vi.fn(),
        sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
        findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
        findTopEarnersInDisplayCurrency: vi.fn(),
      },
      createExchangeRateProviderMock(),
    );

    await expect(service.getAnalyticsSummary({ currency: "US" })).rejects.toThrow();
    await expect(service.getAnalyticsSummary({ currency: "AUD" })).rejects.toThrow();
  });

  it("returns department salary statistics converted to the display currency", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn().mockResolvedValue([
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 120_000,
        },
      ]),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getDepartmentSalaryStatistics({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      departments: [
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 120_000,
        },
      ],
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("returns top earners converted to the display currency", async () => {
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

    const service = new AnalyticsService(analyticsRepository, exchangeRates);

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
    expect(analyticsRepository.findTopEarnersInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      createTestExchangeRateSnapshot().ratesToUsd,
      10,
    );
  });
});
