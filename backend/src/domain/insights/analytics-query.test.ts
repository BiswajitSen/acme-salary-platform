import { describe, expect, it } from "vitest";

import {
  parseInsightAnalyticsQuery,
  parseInsightTimelineQuery,
  parseInsightTopEarnersQuery,
  toEmployeeScopeFromQuery,
} from "./analytics-query.js";

describe("parseInsightAnalyticsQuery", () => {
  it("parses currency and optional scope filters", () => {
    expect(
      parseInsightAnalyticsQuery({
        currency: "USD",
        country: "IN",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      }),
    ).toEqual({
      currency: "USD",
      country: "IN",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });
  });
});

describe("parseInsightTimelineQuery", () => {
  it("parses timeline lookback fields", () => {
    expect(parseInsightTimelineQuery({ months: 3, sinceDate: "2025-06-01" })).toEqual({
      months: 3,
      sinceDate: "2025-06-01",
    });
  });

  it("rejects invalid since dates", () => {
    expect(() => parseInsightTimelineQuery({ sinceDate: "06-01-2025" })).toThrow();
  });
});

describe("toEmployeeScopeFromQuery", () => {
  it("includes only provided scope dimensions", () => {
    expect(toEmployeeScopeFromQuery({ country: "IN" })).toEqual({ country: "IN" });
    expect(toEmployeeScopeFromQuery({ department: "HR" })).toEqual({ department: "HR" });
    expect(toEmployeeScopeFromQuery({ jobTitle: "Analyst" })).toEqual({ jobTitle: "Analyst" });
    expect(toEmployeeScopeFromQuery({})).toEqual({});
  });
});

describe("parseInsightTopEarnersQuery", () => {
  it("delegates to the analytics query parser", () => {
    expect(parseInsightTopEarnersQuery({ currency: "GBP", limit: 5 })).toEqual({
      currency: "GBP",
      limit: 5,
    });
  });
});
