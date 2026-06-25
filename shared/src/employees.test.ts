import { describe, expect, it } from "vitest";

import {
  createEmployeeSchema,
  DEFAULT_EMPLOYEE_LIMIT,
  DEFAULT_EMPLOYEE_PAGE,
  EMPLOYEE_JOB_TITLES,
  listEmployeesQuerySchema,
  MAX_EMPLOYEE_LIMIT,
  updateEmployeeSchema,
} from "./employees";

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

describe("createEmployeeSchema", () => {
  it("accepts a valid employee payload and normalizes country", () => {
    expect(
      createEmployeeSchema.parse({
        id: "E010",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "us",
      }),
    ).toEqual({
      id: "E010",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Engineer",
      country: "US",
    });
  });

  it("rejects missing employee id", () => {
    expect(() =>
      createEmployeeSchema.parse({
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
      }),
    ).toThrow();
  });
});

describe("updateEmployeeSchema", () => {
  it("accepts core employee fields without an id", () => {
    expect(
      updateEmployeeSchema.parse({
        fullName: "Jane Smith",
        department: "Engineering",
        jobTitle: "Staff Engineer",
        country: "us",
      }),
    ).toEqual({
      fullName: "Jane Smith",
      department: "Engineering",
      jobTitle: "Staff Engineer",
      country: "US",
    });
  });

  it("rejects an empty full name", () => {
    expect(() =>
      updateEmployeeSchema.parse({
        fullName: "",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
      }),
    ).toThrow();
  });
});

describe("EMPLOYEE_JOB_TITLES", () => {
  it("includes common role labels used across the app", () => {
    expect(EMPLOYEE_JOB_TITLES).toEqual(
      expect.arrayContaining(["Engineer", "Senior Engineer", "HR Manager"]),
    );
  });
});
