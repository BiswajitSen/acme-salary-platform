import { describe, expect, it } from "vitest";

import type { IInsightAnalyticsRepository } from "./insight-analytics.repository.js";

describe("IInsightAnalyticsRepository", () => {
  it("exposes read-only analytics methods for insight executors", () => {
    const repository = {
      countEmployeesWithLatestCompensation: async () => 0,
      sumLatestCompensationSalariesInDisplayCurrency: async () => 0,
      findDepartmentSalaryStatisticsInDisplayCurrency: async () => [],
      findTopEarnersInDisplayCurrency: async () => [],
      findRecentCompensationEvents: async () => [],
      findRecentPromotions: async () => [],
    } satisfies IInsightAnalyticsRepository;

    expect(repository).toBeDefined();
  });
});
