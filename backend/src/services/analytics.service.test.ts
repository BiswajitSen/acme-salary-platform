import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_DISPLAY_CURRENCIES } from "@acme/shared";

import { AnalyticsService } from "./analytics.service.js";

describe("AnalyticsService", () => {
  it("returns supported display currencies for HR to switch between", async () => {
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository);

    await expect(service.getAvailableCurrencies()).resolves.toEqual({
      currencies: [...ANALYTICS_DISPLAY_CURRENCIES],
    });
  });

  it("returns org-wide headcount with payroll converted to the display currency", async () => {
    const analyticsRepository = {
      countEmployeesWithLatestCompensation: vi.fn().mockResolvedValue(42),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn().mockResolvedValue(5_280_000),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository);

    await expect(service.getAnalyticsSummary({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
    });
    expect(analyticsRepository.countEmployeesWithLatestCompensation).toHaveBeenCalled();
    expect(analyticsRepository.sumLatestCompensationSalariesInDisplayCurrency).toHaveBeenCalledWith(
      "USD",
    );
  });

  it("rejects unsupported display currency codes", async () => {
    const service = new AnalyticsService({
      countEmployeesWithLatestCompensation: vi.fn(),
      sumLatestCompensationSalariesInDisplayCurrency: vi.fn(),
      findDepartmentSalaryStatisticsInDisplayCurrency: vi.fn(),
      findTopEarnersInDisplayCurrency: vi.fn(),
    });

    await expect(service.getAnalyticsSummary({ currency: "US" })).rejects.toThrow();
    await expect(service.getAnalyticsSummary({ currency: "AUD" })).rejects.toThrow();
  });

  it("returns department salary statistics converted to the display currency", async () => {
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

    const service = new AnalyticsService(analyticsRepository);

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
    });
  });

  it("returns top earners converted to the display currency", async () => {
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

    const service = new AnalyticsService(analyticsRepository);

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
    });
    expect(analyticsRepository.findTopEarnersInDisplayCurrency).toHaveBeenCalledWith("USD", 10);
  });
});
