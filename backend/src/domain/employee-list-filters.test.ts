import { describe, expect, it } from "vitest";

import {
  extractEmployeeListFilters,
  parseEmploymentStatusFilter,
  parseMultiValueFilter,
} from "./employee-list-filters.js";

describe("parseMultiValueFilter", () => {
  it("returns undefined for empty values", () => {
    expect(parseMultiValueFilter(undefined)).toBeUndefined();
    expect(parseMultiValueFilter("")).toBeUndefined();
    expect(parseMultiValueFilter("  ,  ")).toBeUndefined();
  });

  it("splits comma-separated values", () => {
    expect(parseMultiValueFilter("US,UK, SG")).toEqual(["US", "UK", "SG"]);
  });
});

describe("extractEmployeeListFilters", () => {
  it("returns undefined for empty filter strings", () => {
    expect(
      extractEmployeeListFilters({
        search: "   ",
        country: "",
      }),
    ).toEqual({});
  });

  it("parses employment status filters", () => {
    expect(parseEmploymentStatusFilter("NO_COMPENSATION,ACTIVE")).toEqual([
      "NO_COMPENSATION",
      "ACTIVE",
    ]);
    expect(parseEmploymentStatusFilter("INVALID")).toBeUndefined();
  });

  it("returns trimmed filter values", () => {
    expect(
      extractEmployeeListFilters({
        search: "  Jane  ",
        country: "US,UK",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        employmentStatus: "NO_COMPENSATION",
      }),
    ).toEqual({
      search: "Jane",
      countries: ["US", "UK"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
      employmentStatuses: ["NO_COMPENSATION"],
    });
  });
});
