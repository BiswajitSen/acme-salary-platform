import { describe, expect, it, vi } from "vitest";

import { AnalyticsService } from "./analytics.service.js";

describe("AnalyticsService", () => {
  it("returns headcount for the requested currency", async () => {
    const analyticsRepository = {
      countEmployeesWithLatestCompensationInCurrency: vi.fn().mockResolvedValue(42),
      sumLatestCompensationSalariesInCurrency: vi.fn().mockResolvedValue(5_280_000),
      findDepartmentSalaryStatisticsByCurrency: vi.fn(),
    };

    const service = new AnalyticsService(analyticsRepository);

    await expect(service.getAnalyticsSummary({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      headcount: 42,
      totalPayroll: 5_280_000,
    });
    expect(
      analyticsRepository.countEmployeesWithLatestCompensationInCurrency,
    ).toHaveBeenCalledWith("USD");
    expect(
      analyticsRepository.sumLatestCompensationSalariesInCurrency,
    ).toHaveBeenCalledWith("USD");
  });

  it("rejects invalid currency query params", async () => {
    const service = new AnalyticsService({
      countEmployeesWithLatestCompensationInCurrency: vi.fn(),
      sumLatestCompensationSalariesInCurrency: vi.fn(),
      findDepartmentSalaryStatisticsByCurrency: vi.fn(),
    });

    await expect(service.getAnalyticsSummary({ currency: "US" })).rejects.toThrow();
  });

  it("returns department salary statistics for the requested currency", async () => {
    const analyticsRepository = {
      countEmployeesWithLatestCompensationInCurrency: vi.fn(),
      sumLatestCompensationSalariesInCurrency: vi.fn(),
      findDepartmentSalaryStatisticsByCurrency: vi.fn().mockResolvedValue([
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 120_000,
        },
      ]),
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
});
