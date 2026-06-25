import { describe, expect, it } from "vitest";

import { buildEmployeeMatchConditions } from "./employee-query-builder.js";

describe("buildEmployeeMatchConditions", () => {
  it("returns undefined when no filters are provided", () => {
    expect(buildEmployeeMatchConditions({})).toBeUndefined();
  });

  it("returns a single condition for one filter", () => {
    expect(buildEmployeeMatchConditions({ countries: ["US"] })).toBeDefined();
  });

  it("combines multiple filters with logical and", () => {
    expect(
      buildEmployeeMatchConditions({
        search: "Jane",
        countries: ["US"],
        departments: ["Engineering"],
        jobTitles: ["Senior Engineer"],
      }),
    ).toBeDefined();
  });
});
