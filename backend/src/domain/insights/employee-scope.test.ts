import { describe, expect, it } from "vitest";

import { buildEmployeeScopeFilter, hasEmployeeScope } from "./employee-scope.js";

describe("hasEmployeeScope", () => {
  it("returns false for an empty scope", () => {
    expect(hasEmployeeScope({})).toBe(false);
  });

  it("returns true when any scope dimension is set", () => {
    expect(hasEmployeeScope({ country: "IN" })).toBe(true);
    expect(hasEmployeeScope({ department: "Engineering" })).toBe(true);
    expect(hasEmployeeScope({ jobTitle: "Senior Engineer" })).toBe(true);
  });
});

describe("buildEmployeeScopeFilter", () => {
  it("returns a SQL fragment for an empty scope", () => {
    expect(buildEmployeeScopeFilter({})).toBeDefined();
  });

  it("returns a different SQL fragment when scope dimensions are set", () => {
    const empty = buildEmployeeScopeFilter({});
    const countryOnly = buildEmployeeScopeFilter({ country: "IN" });
    const departmentOnly = buildEmployeeScopeFilter({ department: "Engineering" });
    const jobTitleOnly = buildEmployeeScopeFilter({ jobTitle: "Senior Engineer" });
    const scoped = buildEmployeeScopeFilter({
      country: "IN",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });

    expect(countryOnly).not.toEqual(empty);
    expect(departmentOnly).not.toEqual(empty);
    expect(jobTitleOnly).not.toEqual(empty);
    expect(scoped).not.toEqual(empty);
  });
});
