import { describe, expect, it } from "vitest";

import { buildEmployeeMatchConditions } from "./employee-query-builder.js";

describe("buildEmployeeMatchConditions", () => {
  it("returns undefined when no filters are provided", () => {
    expect(buildEmployeeMatchConditions({})).toBeUndefined();
  });

  it("returns a single condition for one filter", () => {
    expect(buildEmployeeMatchConditions({ country: "US" })).toBeDefined();
  });

  it("combines multiple filters with logical and", () => {
    expect(
      buildEmployeeMatchConditions({
        search: "Jane",
        country: "US",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      }),
    ).toBeDefined();
  });
});
