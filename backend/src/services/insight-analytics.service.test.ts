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
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
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
        findSalaryStatisticsInDisplayCurrency: vi.fn(),
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
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
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
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
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

  it("passes an optional country filter to payroll and headcount queries", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn().mockResolvedValue(1),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn().mockResolvedValue(106_250),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getAnalyticsSummary({ currency: "USD", country: "UK" })).resolves.toEqual({
      currency: "USD",
      headcount: 1,
      totalPayroll: 106_250,
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsRepository.countEmployeesWithLatestCompensation).toHaveBeenCalledWith({
      country: "UK",
    });
    expect(analyticsRepository.sumLatestCompensationSalariesInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      { country: "UK" },
    );
  });

  it("passes combined department and country filters to payroll queries", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn().mockResolvedValue(1),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn().mockResolvedValue(36_000),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(
      service.getAnalyticsSummary({
        currency: "USD",
        country: "IN",
        department: "Engineering",
      }),
    ).resolves.toEqual({
      currency: "USD",
      headcount: 1,
      totalPayroll: 36_000,
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsRepository.countEmployeesWithLatestCompensation).toHaveBeenCalledWith({
      country: "IN",
      department: "Engineering",
    });
  });

  it("returns scoped salary statistics from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn().mockResolvedValue({
        employeeCount: 2,
        averageSalary: 36_000,
        medianSalary: 35_000,
      }),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(
      service.getScopedSalaryStatistics({ currency: "USD", country: "IN" }),
    ).resolves.toEqual({
      currency: "USD",
      employeeCount: 2,
      averageSalary: 36_000,
      medianSalary: 35_000,
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("passes an optional country filter to the repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn().mockResolvedValue([]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getTopEarners({ currency: "USD", country: "IN" })).resolves.toEqual({
      currency: "USD",
      earners: [],
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsRepository.findTopEarnersInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      expect.any(Number),
      { country: "IN" },
    );
  });
});
