import { describe, expect, it } from "vitest";

import {
  getAnalyticsSummary,
  getDepartmentSalaryStatistics,
  getTopEarners,
} from "./analytics";

describe("getAnalyticsSummary", () => {
  it("fetches summary metrics for a currency", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/analytics/summary?currency=USD");

      return new Response(
        JSON.stringify({ currency: "USD", headcount: 3, totalPayroll: 396_000 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(getAnalyticsSummary("USD")).resolves.toEqual({
      currency: "USD",
      headcount: 3,
      totalPayroll: 396_000,
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
    });
    global.fetch = originalFetch;
  });
});
