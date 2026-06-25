import { describe, expect, it } from "vitest";

import {
  buildInsightQuerySpec,
  extractInsightQueryFilters,
  hasScopedInsightFilters,
  metricSupportsFilter,
  shouldReportScopedEmptyResult,
} from "./insight-query-spec.js";

describe("insight-query-spec", () => {
  it("builds a spec from every supported metric with independent filters", () => {
    const parsedQuery = {
      intent: "TOTAL_PAYROLL" as const,
      originalQuery: "total payroll for Engineering in India",
      department: "Engineering" as const,
      country: "IN" as const,
      jobTitle: null,
      currency: "USD" as const,
      months: null,
      sinceDate: null,
      limit: null,
    };

    expect(buildInsightQuerySpec(parsedQuery)).toEqual({
      metric: "TOTAL_PAYROLL",
      originalQuery: "total payroll for Engineering in India",
      currency: "USD",
      filters: {
        country: "IN",
        department: "Engineering",
        jobTitle: null,
        months: null,
        sinceDate: null,
        limit: null,
      },
    });
  });

  it("defaults promotion lookback months in the filter bundle", () => {
    expect(
      extractInsightQueryFilters({
        intent: "RECENT_PROMOTIONS",
        originalQuery: "recent promotions",
        department: null,
        country: null,
        jobTitle: null,
        currency: null,
        months: null,
        sinceDate: null,
        limit: null,
      }),
    ).toEqual({
      country: null,
      department: null,
      jobTitle: null,
      months: 3,
      sinceDate: null,
      limit: null,
    });
  });

  it("reports that every metric supports country and department filters", () => {
    for (const metric of [
      "AVG_DEPT_SALARY",
      "MEDIAN_DEPT_SALARY",
      "HEADCOUNT",
      "TOTAL_PAYROLL",
      "TOP_EARNERS",
      "BOTTOM_EARNERS",
      "NEAR_MEDIAN_EARNERS",
      "RECENT_PROMOTIONS",
      "RECENT_NEW_HIRES",
      "RECENT_SALARY_INCREASES",
    ] as const) {
      expect(metricSupportsFilter(metric, "country")).toBe(true);
      expect(metricSupportsFilter(metric, "department")).toBe(true);
      expect(metricSupportsFilter(metric, "jobTitle")).toBe(true);
    }
  });

  it("only applies month filters to timeline queries", () => {
    expect(metricSupportsFilter("RECENT_PROMOTIONS", "months")).toBe(true);
    expect(metricSupportsFilter("RECENT_NEW_HIRES", "months")).toBe(true);
    expect(metricSupportsFilter("RECENT_SALARY_INCREASES", "months")).toBe(true);
    expect(metricSupportsFilter("TOP_EARNERS", "months")).toBe(false);
    expect(metricSupportsFilter("TOP_EARNERS", "limit")).toBe(true);
  });

  it("treats scoped empty results differently from organization-wide empty results", () => {
    const scopedFilters = {
      country: "IN" as const,
      department: null,
      jobTitle: null,
      months: null,
      sinceDate: null,
      limit: null,
    };
    const orgWideFilters = {
      country: null,
      department: null,
      jobTitle: null,
      months: null,
      sinceDate: null,
      limit: null,
    };

    expect(hasScopedInsightFilters(scopedFilters)).toBe(true);
    expect(hasScopedInsightFilters(orgWideFilters)).toBe(false);
    expect(shouldReportScopedEmptyResult(scopedFilters, false)).toBe(true);
    expect(shouldReportScopedEmptyResult(orgWideFilters, false)).toBe(false);
  });
});
