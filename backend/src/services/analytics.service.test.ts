import { describe, expect, it, vi } from "vitest";

import { AnalyticsService } from "./analytics.service.js";

describe("AnalyticsService", () => {
  it("returns headcount for the requested currency", async () => {
    const analyticsRepository = {
      countEmployeesWithLatestCompensationInCurrency: vi.fn().mockResolvedValue(42),
    };

    const service = new AnalyticsService(analyticsRepository);

    await expect(service.getAnalyticsSummary({ currency: "USD" })).resolves.toEqual({
      currency: "USD",
      headcount: 42,
    });
    expect(
      analyticsRepository.countEmployeesWithLatestCompensationInCurrency,
    ).toHaveBeenCalledWith("USD");
  });

  it("rejects invalid currency query params", async () => {
    const service = new AnalyticsService({
      countEmployeesWithLatestCompensationInCurrency: vi.fn(),
    });

    await expect(service.getAnalyticsSummary({ currency: "US" })).rejects.toThrow();
  });
});
