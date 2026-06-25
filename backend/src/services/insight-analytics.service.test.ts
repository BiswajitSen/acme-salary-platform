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

  it("passes job title scope filters to salary statistics queries", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn().mockResolvedValue({
        employeeCount: 1,
        averageSalary: 90_000,
        medianSalary: 90_000,
      }),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await service.getScopedSalaryStatistics({
      currency: "USD",
      jobTitle: "Analyst",
    });

    expect(analyticsRepository.findSalaryStatisticsInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      { jobTitle: "Analyst" },
    );
  });

  it("passes department scope filters to salary statistics queries", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn().mockResolvedValue({
        employeeCount: 1,
        averageSalary: 90_000,
        medianSalary: 90_000,
      }),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await service.getScopedSalaryStatistics({
      currency: "USD",
      department: "Engineering",
    });

    expect(analyticsRepository.findSalaryStatisticsInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      { department: "Engineering" },
    );
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

  it("returns bottom earners from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
      findBottomEarnersInDisplayCurrency: vi.fn().mockResolvedValue([]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getBottomEarners({ currency: "USD", limit: 5 })).resolves.toEqual({
      currency: "USD",
      earners: [],
      exchangeRatesAsOf: "2026-01-01",
    });
    expect(analyticsRepository.findBottomEarnersInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      5,
      {},
    );
  });

  it("defaults bottom-earner limits when none are provided", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findBottomEarnersInDisplayCurrency: vi.fn().mockResolvedValue([]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await service.getBottomEarners({ currency: "USD" });

    expect(analyticsRepository.findBottomEarnersInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
      expect.any(Object),
      10,
      {},
    );
  });

  it("returns median split counts from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findMedianSplitCountsInDisplayCurrency: vi.fn().mockResolvedValue({
        medianSalary: 100_000,
        belowMedianCount: 2,
        aboveMedianCount: 3,
        employeeCount: 5,
      }),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getMedianSplitCounts({ currency: "USD", country: "IN" })).resolves.toEqual({
      currency: "USD",
      exchangeRatesAsOf: "2026-01-01",
      medianSalary: 100_000,
      belowMedianCount: 2,
      aboveMedianCount: 3,
      employeeCount: 5,
    });
  });

  it("returns near-median earners from the read-only repository", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findNearMedianEarnersInDisplayCurrency: vi.fn().mockResolvedValue({
        medianSalary: 118_000,
        earners: [],
      }),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(
      service.getNearMedianEarners({
        currency: "USD",
        department: "Engineering",
        tolerancePercent: 10,
      }),
    ).resolves.toEqual({
      currency: "USD",
      earners: [],
      medianSalary: 118_000,
      tolerancePercent: 10,
      exchangeRatesAsOf: "2026-01-01",
    });
  });

  it("returns recent promotions from timeline events", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findRecentCompensationEvents: vi.fn().mockResolvedValue([
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 140_000,
          currency: "USD",
          effectiveDate: "2026-01-01",
          reason: "Promotion",
        },
      ]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await expect(service.getRecentPromotions({ months: 3, country: "IN" })).resolves.toEqual({
      asOfDate: "2026-01-01",
      promotions: [
        expect.objectContaining({
          employeeId: "E001",
          reason: "Promotion",
        }),
      ],
    });
  });

  it("uses since dates instead of month lookbacks for timeline queries", async () => {
    const exchangeRates = createExchangeRateProviderMock();
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findSalaryStatisticsInDisplayCurrency: vi.fn(),
      findRecentCompensationEvents: vi.fn().mockResolvedValue([]),
    };

    const service = new InsightAnalyticsService(analyticsRepository, exchangeRates);

    await service.getRecentTimelineEvents("RECENT_PROMOTIONS", {
      sinceDate: "2025-06-01",
      months: 3,
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });

    expect(analyticsRepository.findRecentCompensationEvents).toHaveBeenCalledWith(
      "2026-01-01",
      { months: null, sinceDate: "2025-06-01" },
      ["Promotion"],
      { department: "Engineering", jobTitle: "Senior Engineer" },
    );
  });
});
