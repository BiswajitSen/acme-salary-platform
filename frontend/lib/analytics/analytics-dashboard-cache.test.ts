import { describe, expect, it, beforeEach } from "vitest";
import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import {
  clearAnalyticsDashboardCache,
  getAnalyticsDashboardCacheTtlMs,
  readAnalyticsEmployeesCache,
  readAnalyticsMetricsCache,
  readAnalyticsStaticCache,
  writeAnalyticsEmployeesCache,
  writeAnalyticsMetricsCache,
  writeAnalyticsStaticCache,
} from "./analytics-dashboard-cache";

const metrics = {
  summary: {
    currency: "USD",
    headcount: 1,
    totalPayroll: 100_000,
    exchangeRatesAsOf: "2026-01-01",
  },
  departmentStatistics: { currency: "USD", departments: [], exchangeRatesAsOf: "2026-01-01" },
  topEarners: { currency: "USD", earners: [], exchangeRatesAsOf: "2026-01-01" },
};

describe("analytics-dashboard-cache", () => {
  beforeEach(() => {
    clearAnalyticsDashboardCache();
  });

  it("returns cached static, employee, and metrics data while fresh", () => {
    const now = Date.now();

    writeAnalyticsStaticCache(
      {
        currencies: ["USD"],
        exchangeRatesAsOf: "2026-01-01",
        ratesToUsd: { ...TEST_EXCHANGE_RATES_TO_USD },
      },
      { countries: [], departments: [], jobTitles: [] },
      now,
    );
    writeAnalyticsEmployeesCache(
      [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Engineer",
          country: "US",
          displaySalary: 120_000,
        },
      ],
      now,
    );
    writeAnalyticsMetricsCache("USD", metrics, now);

    expect(readAnalyticsStaticCache(now)?.currencies.currencies).toEqual(["USD"]);
    expect(readAnalyticsEmployeesCache(now)).toHaveLength(1);
    expect(readAnalyticsMetricsCache("USD", now)?.summary.headcount).toBe(1);
  });

  it("expires cached entries after the ttl", () => {
    const now = Date.now();
    const staleAt = now + getAnalyticsDashboardCacheTtlMs() + 1;

    writeAnalyticsMetricsCache("USD", metrics, now);

    expect(readAnalyticsMetricsCache("USD", staleAt)).toBeNull();
  });
});
