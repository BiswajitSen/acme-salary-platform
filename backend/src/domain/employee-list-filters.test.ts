import { describe, expect, it } from "vitest";

import { extractEmployeeListFilters } from "./employee-list-filters.js";

describe("extractEmployeeListFilters", () => {
  it("returns undefined for empty filter strings", () => {
    expect(
      extractEmployeeListFilters({
        page: 1,
        limit: 50,
        search: "   ",
        country: "",
      }),
    ).toEqual({});
  });

  it("returns trimmed filter values", () => {
    expect(
      extractEmployeeListFilters({
        page: 1,
        limit: 50,
        search: "  Jane  ",
        country: "US",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      }),
    ).toEqual({
      search: "Jane",
      country: "US",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });
  });
});
