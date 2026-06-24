import { describe, expect, it } from "vitest";

import type { IInsightAnalyticsRepository } from "./insight-analytics.repository.js";

describe("IInsightAnalyticsRepository", () => {
  it("exposes read-only analytics methods for insight executors", () => {
    const repository = {
      countEmployeesWithLatestCompensationInCurrency: async () => 0,
      sumLatestCompensationSalariesInCurrency: async () => 0,
      findDepartmentSalaryStatisticsByCurrency: async () => [],
      findTopEarnersByCurrency: async () => [],
    } satisfies IInsightAnalyticsRepository;

    expect(repository).toBeDefined();
  });
});
