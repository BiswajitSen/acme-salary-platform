import { describe, expect, it } from "vitest";

import {
  resolveEmploymentStatus,
  toBasicEmployeeSummary,
  toEmployeeSummary,
} from "./employee-summary.js";

describe("resolveEmploymentStatus", () => {
  it("returns ACTIVE when base salary is present", () => {
    expect(resolveEmploymentStatus(120_000)).toBe("ACTIVE");
  });

  it("returns NO_COMPENSATION when base salary is null", () => {
    expect(resolveEmploymentStatus(null)).toBe("NO_COMPENSATION");
  });
});

describe("toEmployeeSummary", () => {
  it("maps directory row fields and derives employment status", () => {
    expect(
      toEmployeeSummary({
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        baseSalary: 132_000,
        currency: "USD",
      }),
    ).toEqual({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      baseSalary: 132_000,
      currency: "USD",
      employmentStatus: "ACTIVE",
    });
  });
});

describe("toBasicEmployeeSummary", () => {
  it("defaults missing compensation fields to null", () => {
    expect(
      toBasicEmployeeSummary({
        id: "E002",
        fullName: "John Smith",
        department: "HR",
        jobTitle: "People Partner",
        country: "UK",
      }),
    ).toEqual({
      id: "E002",
      fullName: "John Smith",
      department: "HR",
      jobTitle: "People Partner",
      country: "UK",
      baseSalary: null,
      currency: null,
      employmentStatus: "NO_COMPENSATION",
    });
  });
});
