import { describe, expect, it } from "vitest";

import {
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
} from "./employees.js";

describe("listEmployeesQuerySchema", () => {
  it("applies default page and limit", () => {
    expect(listEmployeesQuerySchema.parse({})).toEqual({
      page: DEFAULT_EMPLOYEE_PAGE,
      limit: DEFAULT_EMPLOYEE_LIMIT,
    });
  });

  it("coerces string query params", () => {
    expect(listEmployeesQuerySchema.parse({ page: "2", limit: "25" })).toEqual({
      page: 2,
      limit: 25,
    });
  });

  it("accepts search and filter params", () => {
    expect(
      listEmployeesQuerySchema.parse({
        search: "Jane",
        country: "US",
        department: "Engineering",
        jobTitle: "Senior Engineer",
      }),
    ).toEqual({
      page: DEFAULT_EMPLOYEE_PAGE,
      limit: DEFAULT_EMPLOYEE_LIMIT,
      search: "Jane",
      country: "US",
      department: "Engineering",
      jobTitle: "Senior Engineer",
    });
  });

  it("rejects limit above maximum", () => {
    expect(() =>
      listEmployeesQuerySchema.parse({ limit: MAX_EMPLOYEE_LIMIT + 1 }),
    ).toThrow();
  });

  it("rejects non-positive page", () => {
    expect(() => listEmployeesQuerySchema.parse({ page: 0 })).toThrow();
  });
});
