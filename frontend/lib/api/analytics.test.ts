import { describe, expect, it } from "vitest";

import { TEST_EXCHANGE_RATES_TO_USD } from "@acme/shared";

import {
  getAnalyticsCompensatedEmployees,
  getAnalyticsCurrencies,
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
} from "./analytics";

describe("getAnalyticsCurrencies", () => {
  it("fetches available currencies from compensation data", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/currencies");

      return new Response(
        JSON.stringify({
          currencies: ["GBP", "INR", "USD"],
          exchangeRatesAsOf: "2026-06-24",
          ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getAnalyticsCurrencies()).resolves.toEqual({
      currencies: ["GBP", "INR", "USD"],
      exchangeRatesAsOf: "2026-06-24",
      ratesToUsd: TEST_EXCHANGE_RATES_TO_USD,
    });
    global.fetch = originalFetch;
  });
});

describe("getAnalyticsSummary", () => {
  it("fetches summary metrics for a currency", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/summary?currency=USD");

      return new Response(
        JSON.stringify({
          currency: "USD",
          headcount: 3,
          totalPayroll: 396_000,
          exchangeRatesAsOf: "2026-06-24",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getAnalyticsSummary("USD")).resolves.toEqual({
      currency: "USD",
      headcount: 3,
      totalPayroll: 396_000,
      exchangeRatesAsOf: "2026-06-24",
    });
    global.fetch = originalFetch;
  });
});

describe("getDepartmentSalaryStatistics", () => {
  it("fetches department statistics for a currency", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/departments?currency=USD");

      return new Response(
        JSON.stringify({
          currency: "USD",
          departments: [
            {
              department: "Engineering",
              employeeCount: 2,
              averageSalary: 120_000,
              medianSalary: 120_000,
            },
          ],
          exchangeRatesAsOf: "2026-06-24",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getDepartmentSalaryStatistics("USD")).resolves.toEqual({
      currency: "USD",
      departments: [
        {
          department: "Engineering",
          employeeCount: 2,
          averageSalary: 120_000,
          medianSalary: 120_000,
        },
      ],
      exchangeRatesAsOf: "2026-06-24",
    });
    global.fetch = originalFetch;
  });
});

describe("getTopEarners", () => {
  it("fetches top earners for a currency", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/top-earners?currency=USD");

      return new Response(
        JSON.stringify({
          currency: "USD",
          earners: [
            {
              employeeId: "E001",
              fullName: "Jane Doe",
              department: "Engineering",
              baseSalary: 132_000,
            },
          ],
          exchangeRatesAsOf: "2026-06-24",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getTopEarners("USD")).resolves.toEqual({
      currency: "USD",
      earners: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          baseSalary: 132_000,
        },
      ],
      exchangeRatesAsOf: "2026-06-24",
    });
    global.fetch = originalFetch;
  });
});

describe("getAnalyticsCompensatedEmployees", () => {
  it("fetches compensated employees for a currency", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/compensated-employees?currency=USD");

      return new Response(
        JSON.stringify({
          currency: "USD",
          employees: [
            {
              employeeId: "E001",
              fullName: "Jane Doe",
              department: "Engineering",
              jobTitle: "Senior Engineer",
              country: "US",
              displaySalary: 132_000,
            },
          ],
          exchangeRatesAsOf: "2026-06-24",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getAnalyticsCompensatedEmployees("USD")).resolves.toEqual({
      currency: "USD",
      employees: [
        {
          employeeId: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
          displaySalary: 132_000,
        },
      ],
      exchangeRatesAsOf: "2026-06-24",
    });
    global.fetch = originalFetch;
  });
});
