import { describe, expect, it } from "vitest";

import type { ParsedInsightQuery } from "@acme/shared";

import { formatInsightScopeLabel, hasInsightEmployeeScope } from "./scope-label.js";

function parsed(
  overrides: Partial<ParsedInsightQuery> &
    Pick<ParsedInsightQuery, "intent" | "originalQuery">,
): ParsedInsightQuery {
  return {
    department: null,
    country: null,
    jobTitle: null,
    currency: null,
    months: null,
    sinceDate: null,
    limit: null,
    medianSplitFocus: null,
    ...overrides,
  };
}

describe("formatInsightScopeLabel", () => {
  it("returns a default label when no filters are present", () => {
    expect(
      formatInsightScopeLabel(parsed({ intent: "HEADCOUNT", originalQuery: "headcount" })),
    ).toBe("matching employees");
  });

  it("includes job titles and countries in the label", () => {
    expect(
      formatInsightScopeLabel(
        parsed({
          intent: "HEADCOUNT",
          originalQuery: "headcount",
          jobTitle: "Staff Engineer",
          country: "IN",
        }),
      ),
    ).toBe("Staff Engineer · employees in IN");
  });

  it("joins department and country filters", () => {
    expect(
      formatInsightScopeLabel(
        parsed({
          intent: "HEADCOUNT",
          originalQuery: "headcount",
          department: "HR",
          country: "IN",
        }),
      ),
    ).toBe("HR · employees in IN");
  });
});

describe("hasInsightEmployeeScope", () => {
  it("returns false for organization-wide queries", () => {
    expect(
      hasInsightEmployeeScope(parsed({ intent: "HEADCOUNT", originalQuery: "headcount" })),
    ).toBe(false);
  });

  it("returns true when any employee scope filter is present", () => {
    expect(
      hasInsightEmployeeScope(
        parsed({
          intent: "HEADCOUNT",
          originalQuery: "headcount in engineering",
          department: "Engineering",
        }),
      ),
    ).toBe(true);
  });
});
